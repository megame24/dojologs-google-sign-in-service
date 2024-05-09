const { SSMClient, GetParametersCommand } = require("@aws-sdk/client-ssm");
const { OAuth2Client } = require("google-auth-library");

const ssmClient = new SSMClient({ region: process.env.AWS_REGION });
const client = new OAuth2Client();

const parameterEnvNameMap = {
  [process.env.IOS_CLIENT_ID_SECRETE_NAME]: 'IOS_CLIENT_ID',
  [process.env.ANDROID_CLIENT_ID_SECRETE_NAME]: 'ANDROID_CLIENT_ID',
  [process.env.WEB_CLIENT_ID_SECRETE_NAME]: 'WEB_CLIENT_ID'
};

const getAndSetSecretes = async () => {
  const params = {
    Names: [
      process.env.IOS_CLIENT_ID_SECRETE_NAME,
      process.env.ANDROID_CLIENT_ID_SECRETE_NAME,
      process.env.WEB_CLIENT_ID_SECRETE_NAME
    ],
    WithDecryption: true
  }

  const command = new GetParametersCommand(params);
  const data = await ssmClient.send(command);

  data.Parameters.forEach(param => {
    process.env[parameterEnvNameMap[param.Name]] = param.Value;
  });
}


exports.handler = async (event) => {
  try {
    await getAndSetSecretes();

    const { idToken } = event;

    const ticket = await client.verifyIdToken({
      idToken,
      audience: [
        process.env.IOS_CLIENT_ID,
        process.env.ANDROID_CLIENT_ID,
        process.env.WEB_CLIENT_ID,
      ],
    });
    const payload = ticket.getPayload();

    return {
      statusCode: 200,
      body: payload
    }
  } catch (error) {
    console.error('Error ocurred', error)
  }
}
