import dotenv from 'dotenv';
dotenv.config();

const env = {
  MASTER_KEY: process.env.MASTER_KEY?.length === 64 ? '✅ (64 chars)' : '❌ (invalid)',
  DATABASE_URL: process.env.DATABASE_URL ? '✅' : '❌ (missing)',
  NODE_ENV: process.env.NODE_ENV || '❌ (not set)',
};

console.table(env);
