require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Track = require('./models/Track');
const GuestAccount = require('./models/GuestAccount');

async function seedDB() {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/phonk_hub';
    await mongoose.connect(connStr);
    console.log('🌱 Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Track.deleteMany({});
    await GuestAccount.deleteMany({});

    // 1. Create Default Admin User
    const passwordHash = await bcrypt.hash('phonk123456', 10);
    const adminUser = await User.create({
      username: 'phonk_master',
      email: 'admin@phonkhub.com',
      passwordHash,
      name: 'KORDHELL // PHONK HUB OFFICIAL',
      bio: 'Official Phonk Hub producer channel. High bpm drift phonk & Memphis beats.',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
      role: 'ADMIN',
      followersCount: 12400,
      followingCount: 15,
    });
    console.log('✅ Admin user created:', adminUser.username);

    // 2. Create Sample Guest Account
    const sampleGuest = await GuestAccount.create({
      guestToken: 'guest_sample_token_808',
      guestName: 'Drift Guest #808',
      deviceId: 'web-device-preview',
      ipAddress: '127.0.0.1',
    });
    console.log('✅ Sample Guest Account created:', sampleGuest.guestName);

    // 3. Create Sample Tracks
    const tracks = [
      {
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
        featured: true,
        description: 'High energy drift phonk anthem featuring aggressive basslines and distorted cowbells.',
        userId: adminUser._id,
      },
      {
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
        featured: true,
        description: 'Groovy house beats infused with classic Memphis vocal chops.',
        userId: adminUser._id,
      },
      {
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
        featured: false,
        description: 'Atmospheric wave vibe with sub-bass and smooth synth pads.',
        userId: adminUser._id,
      },
    ];

    for (const trackData of tracks) {
      const created = await Track.create(trackData);
      console.log(`🎵 Seeded Track: ${created.title} by ${created.artist}`);
    }

    console.log('🎉 MongoDB database successfully seeded!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seedDB();
