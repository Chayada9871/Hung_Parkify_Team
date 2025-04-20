// db.js
import postgres from 'postgres';

const connectionString =
  'postgresql://postgres.fyvonpbxynpnzylufjfr:x9FTZUcgyDjIk529@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres';

const sql = postgres(connectionString, {
  ssl: 'require',
});

export default sql;
