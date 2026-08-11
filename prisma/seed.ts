import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_ROOMS = [
  { id: 'room-a', name: 'Meeting Room A (Main)', capacity: 8 },
  { id: 'room-b', name: 'Meeting Room B (Focus)', capacity: 4 },
  { id: 'room-c', name: 'Conference Hall', capacity: 20 },
];

async function main() {
  console.log('Enabling Write-Ahead Logging (WAL) mode...');
  await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
  // [ORIGINAL CODE]: await prisma.$executeRawUnsafe('PRAGMA journal_mode = WAL;');
  // [WHY IT WAS WRONG]: SQLite's `PRAGMA journal_mode = WAL` always returns a row containing 
  // the new journal mode. Prisma's `$executeRawUnsafe` is strictly typed for statements that 
  // only return an affected-row count (like INSERT/UPDATE), so it throws a P2010 "Execute returned results"
  //  error when it receives a result set back from SQLite.
  // [HOW THIS IS BETTER]: `$queryRawUnsafe` is explicitly designed to handle statements that return rows. 
  // It gracefully accepts the returned journal mode row (or an empty array if nothing is returned) without throwing 
  // a type or execution error, allowing the script to safely proceed.
  // [WHAT HAPPENS IF REMOVED]: The database will default to its standard rollback journal mode instead of WAL. 
  // This drastically reduces concurrent read/write performance and increases the likelihood of database lock timeouts 
  // (P2024) under load.
  // [BEST PRACTICE]: When executing raw SQL against an ORM, always verify whether the underlying database engine 
  // returns a payload for that specific command, and choose your ORM's raw execution method (query vs. execute) 
  // accordingly to maintain type safety.

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