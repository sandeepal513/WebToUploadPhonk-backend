const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting MySQL database seeding for PHONK HUB...');

  // 1. Create Default Admin / Creator User
  const passwordHash = await bcrypt.hash('phonk123456', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@phonkhub.com' },
    update: {},
    create: {
      username: 'phonk_master',
      email: 'admin@phonkhub.com',
      passwordHash: passwordHash,
      name: 'KORDHELL // PHONK HUB OFFICIAL',
      bio: 'Official Phonk Hub producer channel. High bpm drift phonk & Memphis beats.',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
      role: 'ADMIN',
      followersCount: 12400,
      followingCount: 15,
    },
  });

  console.log('✅ Admin user ready:', adminUser.username);

  // 2. Create Default Guest Account Sample
  const guestAccount = await prisma.guestAccount.upsert({
    where: { guestToken: 'guest-token-sample-001' },
    update: {},
    create: {
      guestToken: 'guest-token-sample-001',
      guestName: 'Drift Guest #808',
      deviceId: 'device-web-preview',
      ipAddress: '127.0.0.1',
    },
  });

  console.log('✅ Sample Guest Account ready:', guestAccount.guestName);

  // 3. Seed Initial Phonk Tracks
  const sampleTracks = [
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
      userId: adminUser.id,
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
      userId: adminUser.id,
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
      userId: adminUser.id,
    }
  ];

  for (const trackData of sampleTracks) {
    const track = await prisma.track.create({
      data: trackData,
    });
    console.log(`🎵 Seeded Track: ${track.title} by ${track.artist}`);
  }

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
