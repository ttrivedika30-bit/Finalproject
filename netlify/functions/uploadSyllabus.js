// netlify/functions/uploadSyllabus.js
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
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders };
  }

  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: 'Not authenticated.' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { filename, contentType, dataBase64 } = body;
    if (!filename || !dataBase64) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'filename and dataBase64 required' }) };
    }

    const dbName = process.env.CLOUDANT_DB_UPLOADS || 'uploads';
    const docId = `user:${user.sub}`; // one doc per user for uploads
    // Ensure doc exists (create if not)
    try {
      await cloudant.putDocument({ db: dbName, docId, document: { _id: docId, email: user.email } });
    } catch (e) {
      // ignore conflict when document already exists
    }

    const buffer = Buffer.from(dataBase64, 'base64');

    // Put attachment
    const r = await cloudant.putAttachment({
      db: dbName,
      docId,
      attachmentName: filename,
      contentType: contentType || 'application/octet-stream',
      attachment: buffer
    });

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ result: r.result }) };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
