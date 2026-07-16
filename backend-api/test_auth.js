const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirst({ where: { name: 'Adem' } });
  if (!user) {
    console.log('User Adem not found');
    return;
  }
  const payload = { sub: user.id, phone: user.phone, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'some_super_secret_access_key_min_32_characters', { expiresIn: '15m' });
  console.log('Token:', token);
  
  const res = await fetch('https://esnaaf-backend-339090537138.europe-west3.run.app/api/musteri/talepler', {
    headers: { Authorization: 'Bearer ' + token }
  });
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}

run().finally(() => prisma.$disconnect());
