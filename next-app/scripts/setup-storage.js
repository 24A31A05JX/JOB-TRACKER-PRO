const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  console.log('Ensuring "resumes" bucket exists...');
  
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('Error listing buckets:', listError);
    return;
  }

  const bucketExists = buckets.some(b => b.name === 'resumes');

  if (!bucketExists) {
    console.log('Creating "resumes" bucket...');
    const { error: createError } = await supabase.storage.createBucket('resumes', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    });

    if (createError) {
      console.error('Error creating bucket:', createError);
    } else {
      console.log('Bucket "resumes" created successfully.');
    }
  } else {
    console.log('Bucket "resumes" already exists.');
  }
}

setupStorage();
