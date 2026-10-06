const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ypmcdnywfarjlcuxtamz.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_7ziSnHK9SJwiLyKCPCBWng_QpMNkfVm';

const AUDIO_BUCKET = process.env.SUPABASE_AUDIO_BUCKET || 'phonkHub-audio';
const PROFILE_BUCKET = process.env.SUPABASE_PROFILE_BUCKET || 'phonkhub-profile';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Clean filename for storage path
 */
function sanitizeFileName(filename) {
  const ext = path.extname(filename);
  const name = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${name}_${Date.now()}${ext}`;
}

/**
 * Upload Audio File to Supabase 'phonkHub-audio' Bucket
 * @param {Buffer|String} fileBufferOrPath - File Buffer or Local File Path
 * @param {String} originalName - Original File Name
 * @param {String} mimeType - File Mime Type
 * @returns {Promise<string>} Public URL of uploaded audio
 */
async function uploadAudioToSupabase(fileBufferOrPath, originalName, mimeType = 'audio/mpeg') {
  try {
    const buffer = typeof fileBufferOrPath === 'string' ? fs.readFileSync(fileBufferOrPath) : fileBufferOrPath;
    const fileName = `audio/${sanitizeFileName(originalName)}`;

    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error(`❌ Error uploading audio to Supabase bucket '${AUDIO_BUCKET}':`, error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(fileName);

    console.log(`✅ Audio successfully uploaded to Supabase [${AUDIO_BUCKET}]:`, publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Supabase Audio Upload Failed:', err.message);
    throw err;
  }
}

/**
 * Upload Profile Picture / Avatar to Supabase 'phonkhub-profile' Bucket
 * @param {Buffer|String} fileBufferOrPath - File Buffer or Local File Path
 * @param {String} originalName - Original File Name
 * @param {String} mimeType - File Mime Type
 * @returns {Promise<string>} Public URL of uploaded avatar image
 */
async function uploadProfileImageToSupabase(fileBufferOrPath, originalName, mimeType = 'image/jpeg') {
  try {
    const buffer = typeof fileBufferOrPath === 'string' ? fs.readFileSync(fileBufferOrPath) : fileBufferOrPath;
    const fileName = `avatars/${sanitizeFileName(originalName)}`;

    const { data, error } = await supabase.storage
      .from(PROFILE_BUCKET)
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error(`❌ Error uploading profile image to Supabase bucket '${PROFILE_BUCKET}':`, error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from(PROFILE_BUCKET)
      .getPublicUrl(fileName);

    console.log(`✅ Profile image successfully uploaded to Supabase [${PROFILE_BUCKET}]:`, publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Supabase Profile Image Upload Failed:', err.message);
    throw err;
  }
}

/**
 * Upload Track Cover Artwork to Supabase 'phonkhub-profile' Bucket
 * @param {Buffer|String} fileBufferOrPath - File Buffer or Local File Path
 * @param {String} originalName - Original File Name
 * @param {String} mimeType - File Mime Type
 * @returns {Promise<string>} Public URL of uploaded cover image
 */
async function uploadCoverImageToSupabase(fileBufferOrPath, originalName, mimeType = 'image/jpeg') {
  try {
    const buffer = typeof fileBufferOrPath === 'string' ? fs.readFileSync(fileBufferOrPath) : fileBufferOrPath;
    const fileName = `covers/${sanitizeFileName(originalName)}`;

    const { data, error } = await supabase.storage
      .from(PROFILE_BUCKET)
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error(`❌ Error uploading cover image to Supabase bucket '${PROFILE_BUCKET}':`, error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from(PROFILE_BUCKET)
      .getPublicUrl(fileName);

    console.log(`✅ Cover image successfully uploaded to Supabase [${PROFILE_BUCKET}]:`, publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Supabase Cover Upload Failed:', err.message);
    throw err;
  }
}

/**
 * Delete Audio File from Supabase 'phonkHub-audio' Bucket
 * @param {String} audioUrl - Full Public Supabase URL or relative storage path
 */
async function deleteAudioFromSupabase(audioUrl) {
  if (!audioUrl || typeof audioUrl !== 'string') return;
  try {
    let filePath = audioUrl;
    if (audioUrl.includes(`/${AUDIO_BUCKET}/`)) {
      filePath = audioUrl.split(`/${AUDIO_BUCKET}/`)[1];
    }
    if (!filePath || filePath.startsWith('synth:')) return;

    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .remove([filePath]);

    if (error) {
      console.warn(`⚠️ Warning deleting audio from Supabase bucket '${AUDIO_BUCKET}':`, error.message);
    } else {
      console.log(`🗑️ Successfully deleted audio file from Supabase [${AUDIO_BUCKET}]:`, filePath);
    }
  } catch (err) {
    console.error('Delete Audio from Supabase error:', err.message);
  }
}

/**
 * Delete Cover Artwork from Supabase 'phonkhub-profile' Bucket
 * @param {String} coverUrl - Full Public Supabase URL or relative storage path
 */
async function deleteCoverFromSupabase(coverUrl) {
  if (!coverUrl || typeof coverUrl !== 'string') return;
  try {
    let filePath = coverUrl;
    if (coverUrl.includes(`/${PROFILE_BUCKET}/`)) {
      filePath = coverUrl.split(`/${PROFILE_BUCKET}/`)[1];
    }
    if (!filePath || filePath.startsWith('/assets/')) return;

    const { data, error } = await supabase.storage
      .from(PROFILE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.warn(`⚠️ Warning deleting cover image from Supabase bucket '${PROFILE_BUCKET}':`, error.message);
    } else {
      console.log(`🗑️ Successfully deleted cover image from Supabase [${PROFILE_BUCKET}]:`, filePath);
    }
  } catch (err) {
    console.error('Delete Cover from Supabase error:', err.message);
  }
}

module.exports = {
  supabase,
  AUDIO_BUCKET,
  PROFILE_BUCKET,
  uploadAudioToSupabase,
  uploadProfileImageToSupabase,
  uploadCoverImageToSupabase,
  deleteAudioFromSupabase,
  deleteCoverFromSupabase,
};
