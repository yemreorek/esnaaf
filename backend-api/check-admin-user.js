const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const phoneUtil = require('./dist/common/utils/phone.util');

async function main() {
  const encPhone = phoneUtil.encryptPhone('+905999999999');
  console.log(`Encrypted phone: ${encPhone}`);
  
  const user = await prisma.user.findUnique({
    where: { phone: encPhone }
  });
  
  console.log('User:', user);
}

main().catch(console.error).finally(() => prisma.$disconnect());
