import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_ROOMS = [
  { id: 'room-a', name: 'Meeting Room A (Main)', capacity: 8 },
  { id: 'room-b', name: 'Meeting Room B (Focus)', capacity: 4 },
  { id: 'room-c', name: 'Conference Hall', capacity: 20 },
];

async function main() {
  console.log('Enabling Write-Ahead Logging (WAL) mode...');
  await prisma.$executeRawUnsafe('PRAGMA journal_mode=WAL;');

  console.log('Seeding database with default rooms...');
  for (const room of DEFAULT_ROOMS) {
    await prisma.room.upsert({
      where: { id: room.id },
      update: { name: room.name, capacity: room.capacity },
      create: room,
    });
  }
  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });