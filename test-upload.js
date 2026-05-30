
require('dotenv').config();

const SUPABASE_URL = process.env.POSTGRES_URL_SUPABASE_URL;
const SERVICE_KEY = process.env.POSTGRES_URL_SUPABASE_SERVICE_ROLE_KEY;

async function testUpload() {
  const fileName = 'test-' + Date.now() + '.png';
  
  // 1. Get signed url
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/upload/sign/uploads/${fileName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });
  const data = await res.json();
  const signedUrl = `${SUPABASE_URL}/storage/v1${data.url}`;
  
  // 2. Upload text
  const uploadRes = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${data.token}`,
      'Content-Type': 'image/png'
    },
    body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64')
  });
  console.log('Upload Status:', uploadRes.status);
  console.log('Upload Body:', await uploadRes.text());
  
  // 3. Try to fetch public url
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/uploads/${fileName}`;
  console.log('Public URL:', publicUrl);
  
  const pubRes = await fetch(publicUrl);
  console.log('Public fetch status:', pubRes.status);
  console.log('Content:', await pubRes.text());
}

testUpload().catch(console.error);
