const { PrismaClient } = require('./node_modules/@prisma/client');
const jwt = require('./node_modules/jsonwebtoken');
const prisma = new PrismaClient({datasources: {db: {url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'}}});

async function main() {
  const kemal = await prisma.user.findFirst({ where: { name: { contains: 'kemal', mode: 'insensitive' } } });
  
  const payload = { sub: kemal.id, phone: kemal.phone, role: kemal.role };
  const token = jwt.sign(payload, 'some_super_secret_access_key_min_32_characters', { expiresIn: '1d' });
  
  console.log(`Generated Token: ${token}`);
  
  try {
    const res = await fetch('https://esnaaf-backend-339090537138.europe-west3.run.app/api/hizmetveren/gelen-isler', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    console.log(`Jobs Returned: ${data.length}`);
    if (data.length > 0) {
      console.log(`First job ID: ${data[0].id}`);
      console.log(`First job Category: ${data[0].categoryName}`);
    } else {
      console.log(JSON.stringify(data));
    }
  } catch(e) {
    console.error('Fetch failed:', e);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
