// Simple script to seed the database with dummy data
const { exec } = require('child_process');

console.log('🌱 Starting database seeding...');

// Run the TypeScript seed file
exec('npx tsx server/database/seed.ts', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Seeding failed:', error);
    return;
  }
  
  if (stderr) {
    console.error('⚠️ Warnings:', stderr);
  }
  
  console.log('📊 Seeding output:');
  console.log(stdout);
  console.log('✅ Database seeding completed!');
});



