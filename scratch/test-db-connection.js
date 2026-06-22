const { Client } = require('c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/backend-api/node_modules/pg');

const connectionString = 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public';

async function run() {
  const client = new Client({ connectionString });
  try {
    console.log('Connecting to production database...');
    await client.connect();
    console.log('Connected successfully!');
    const res = await client.query('SELECT version()');
    console.log('PostgreSQL Version:', res.rows[0].version);
    await client.end();
  } catch (err) {
    console.error('Connection failed:', err);
  }
}

run();
