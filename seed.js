require('dotenv').config();
const bcrypt = require('bcryptjs');
const { connectDB, pool } = require('./db/database');

async function seedDB() {
  try {
    await connectDB();
    console.log('🌱 Connected to Aiven MySQL Cloud for seeding...');

    // Clear existing records
    await pool.query('DELETE FROM likes');
    await pool.query('DELETE FROM tracks');
    await pool.query('DELETE FROM guest_accounts');
    await pool.query('DELETE FROM users');

    // 1. Create Default Admin User
    const adminId = `usr_admin_${Date.now()}`;
    const passwordHash = await bcrypt.hash('phonk123456', 10);
    await pool.query(
      `INSERT INTO users (id, username, email, password_hash, name, bio, avatar, role, followers_count, following_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adminId,
        'phonk_master',
        'admin@phonkhub.com',
        passwordHash,
        'KORDHELL // PHONK HUB OFFICIAL',
        'Official Phonk Hub producer channel. High bpm drift phonk & Memphis beats.',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
        'ADMIN',
        12400,
        15,
      ]
    );
    console.log('✅ Admin user created: phonk_master');

    // 2. Create Sample Guest Account
    const guestId = `gst_sample_${Date.now()}`;
    await pool.query(
      `INSERT INTO guest_accounts (id, guest_token, guest_name, device_id, ip_address)
       VALUES (?, ?, ?, ?, ?)`,
      [guestId, 'guest_sample_token_808', 'Drift Guest #808', 'web-device-preview', '127.0.0.1']
    );
    console.log('✅ Sample Guest Account created: Drift Guest #808');

    // 3. Create Sample Tracks
    const tracks = [
      {
        id: `trk_1_${Date.now()}`,
        title: 'MURDER IN MY MIND',
        artist: 'KORDHELL',
        album: 'DRIFT MANIA',
        subgenre: 'Drift Phonk',
        duration: '2:25',
        durationSec: 145,
        plays: 1850000,
        likesCount: 142000,
        downloadCount: 45000,
        bpm: 160,
        rating: 5,
        coverUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=500&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=action-cyberpunk-112578.mp3',
        downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=action-cyberpunk-112578.mp3',
        mood: 'Aggressive',
        featured: 1,
        description: 'High energy drift phonk anthem featuring aggressive basslines and distorted cowbells.',
        userId: adminId,
      },
      {
        id: `trk_2_${Date.now()}`,
        title: 'RAVE NIGHT',
        artist: 'DVRST',
        album: 'MEMPHIS NIGHTS',
        subgenre: 'Phonk House',
        duration: '2:40',
        durationSec: 160,
        plays: 980000,
        likesCount: 88000,
        downloadCount: 21000,
        bpm: 128,
        rating: 5,
        coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=500&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73379.mp3?filename=cyberpunk-2099-10701.mp3',
        downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73379.mp3?filename=cyberpunk-2099-10701.mp3',
        mood: 'Energetic',
        featured: 1,
        description: 'Groovy house beats infused with classic Memphis vocal chops.',
        userId: adminId,
      },
      {
        id: `trk_3_${Date.now()}`,
        title: 'SHADOW DANCER',
        artist: 'GHOSTFACE PLAYA',
        album: 'UNDERGROUND SOUNDS',
        subgenre: 'Chill Phonk',
        duration: '3:10',
        durationSec: 190,
        plays: 420000,
        likesCount: 35000,
        downloadCount: 9500,
        bpm: 110,
        rating: 4,
        coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=500&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=dark-mystery-trailer-116581.mp3',
        downloadUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=dark-mystery-trailer-116581.mp3',
        mood: 'Chill',
        featured: 0,
        description: 'Atmospheric wave vibe with sub-bass and smooth synth pads.',
        userId: adminId,
      },
    ];

    for (const trk of tracks) {
      await pool.query(
        `INSERT INTO tracks 
         (id, title, artist, album, subgenre, duration, duration_sec, plays, likes_count, download_count, bpm, rating, cover_url, audio_url, download_url, mood, featured, description, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          trk.id,
          trk.title,
          trk.artist,
          trk.album,
          trk.subgenre,
          trk.duration,
          trk.durationSec,
          trk.plays,
          trk.likesCount,
          trk.downloadCount,
          trk.bpm,
          trk.rating,
          trk.coverUrl,
          trk.audioUrl,
          trk.downloadUrl,
          trk.mood,
          trk.featured,
          trk.description,
          trk.userId,
        ]
      );
      console.log(`🎵 Seeded Track: ${trk.title} by ${trk.artist}`);
    }

    console.log('🎉 Aiven MySQL database successfully seeded!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seedDB();
