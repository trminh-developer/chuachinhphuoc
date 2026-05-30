
require('dotenv').config();

const SUPABASE_URL = process.env.POSTGRES_URL_SUPABASE_URL;
const SERVICE_KEY = process.env.POSTGRES_URL_SUPABASE_SERVICE_ROLE_KEY;

async function setupStorage() {
  console.log('Creating uploads bucket...');
  
  // 1. Create Bucket
  const createRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: 'uploads',
      name: 'uploads',
      public: true,
      file_size_limit: 52428800, // 50MB
      allowed_mime_types: ['image/*', 'audio/*', 'video/*']
    })
  });
  
  const createData = await createRes.json();
  console.log('Bucket Creation Response:', createData);
}

setupStorage().catch(console.error);
