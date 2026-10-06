const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ypmcdnywfarjlcuxtamz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7ziSnHK9SJwiLyKCPCBWng_QpMNkfVm';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testSupabase() {
  console.log('Testing Supabase connection...');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error('Error listing buckets:', error);
    } else {
      console.log('Buckets found:', buckets.map(b => b.name));
    }

    // Test audio upload / check phonkHub-audio bucket
    const audioBucketName = 'phonkHub-audio';
    const profileBucketName = 'phonkhub-profile';

    console.log(`Checking bucket accessibility for ${audioBucketName} & ${profileBucketName}...`);

    // Test uploading dummy buffer or listing files in phonkHub-audio
    const { data: audioFiles, error: audioErr } = await supabase.storage.from(audioBucketName).list();
    if (audioErr) {
      console.log(`Note on ${audioBucketName}:`, audioErr.message);
    } else {
      console.log(`Successfully connected to bucket '${audioBucketName}' (${audioFiles.length} items found)`);
    }

    const { data: profileFiles, error: profileErr } = await supabase.storage.from(profileBucketName).list();
    if (profileErr) {
      console.log(`Note on ${profileBucketName}:`, profileErr.message);
    } else {
      console.log(`Successfully connected to bucket '${profileBucketName}' (${profileFiles.length} items found)`);
    }

  } catch (err) {
    console.error('Supabase test failed:', err);
  }
}

testSupabase();
