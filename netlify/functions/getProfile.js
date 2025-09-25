// netlify/functions/getProfile.js
const { CloudantV1 } = require('@ibm-cloud/cloudant');
const { IamAuthenticator } = require('ibm-cloud-sdk-core');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const cloudant = CloudantV1.newInstance({
  authenticator: new IamAuthenticator({ apikey: process.env.CLOUDANT_APIKEY })
});
cloudant.setServiceUrl(process.env.CLOUDANT_URL || '');

exports.handler = async (event, context) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders };
  }

  // Netlify will populate context.clientContext.user if the request had a valid Identity JWT
  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return {
      statusCode: 401, headers: corsHeaders,
      body: JSON.stringify({ error: 'Not authenticated. Log in with Netlify Identity.' })
    };
  }

  try {
    const email = user.email || (user.user_metadata && user.user_metadata.email) || user.sub;
    const dbName = process.env.CLOUDANT_DB_USERS || 'users';

    // Find user docs by email
    const result = await cloudant.postFind({
      db: dbName,
      selector: { email: { "$eq": email } },
      limit: 10
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ docs: result.result.docs })
    };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
