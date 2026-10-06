require('dotenv').config();
const { uploadAudioToSupabase, uploadProfileImageToSupabase, uploadCoverImageToSupabase } = require('./services/supabase');

async function testUploads() {
  console.log('Testing Supabase uploads to buckets...');
  try {
    // 1. Test audio upload
    const dummyAudioBuffer = Buffer.from('ID3...dummy audio content');
    const audioUrl = await uploadAudioToSupabase(dummyAudioBuffer, 'test_phonk_beat.mp3', 'audio/mpeg');
    console.log('🎉 Audio Bucket (phonkHub-audio) Upload Result:', audioUrl);

    // 2. Test profile image upload
    const dummyProfileBuffer = Buffer.from('JPEG...dummy image content');
    const profileUrl = await uploadProfileImageToSupabase(dummyProfileBuffer, 'test_producer_avatar.jpg', 'image/jpeg');
    console.log('🎉 Profile Bucket (phonkhub-profile) Upload Result:', profileUrl);

    // 3. Test cover upload
    const coverUrl = await uploadCoverImageToSupabase(dummyProfileBuffer, 'test_cover_art.jpg', 'image/jpeg');
    console.log('🎉 Cover Artwork (phonkhub-profile) Upload Result:', coverUrl);

    console.log('✅ ALL SUPABASE STORAGE BUCKETS OPERATIONAL!');
  } catch (err) {
    console.error('❌ Upload test failed:', err);
  }
}

testUploads();
