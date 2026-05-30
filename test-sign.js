
require('dotenv').config();

const SUPABASE_URL = process.env.POSTGRES_URL_SUPABASE_URL;
const SERVICE_KEY = process.env.POSTGRES_URL_SUPABASE_SERVICE_ROLE_KEY;

async function testSignedUpload() {
  const fileName = 'test-' + Date.now() + '.jpg';
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/upload/sign/uploads/${fileName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });
  
  const data = await res.json();
  console.log('Signed URL Response:', data);
}

testSignedUpload().catch(console.error);
