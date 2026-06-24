const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("=== ALL USERS ===");
  const users = await prisma.user.findMany({
    include: {
      service_provider: true
    }
  });
  for (const u of users) {
    console.log(`User ID: ${u.id} | Name: ${u.name} | Role: ${u.role} | Active: ${u.is_active} | Has Provider Profile: ${!!u.service_provider}`);
  }

  console.log("\n=== SEARCHING FOR 'ASAF' ===");
  const asafUsers = users.filter(u => u.name && u.name.toLowerCase().includes('asaf'));
  if (asafUsers.length === 0) {
    console.log("No user found with name containing 'asaf'");
  } else {
    for (const u of asafUsers) {
      console.log(`Found: ID: ${u.id} | Name: ${u.name} | Role: ${u.role} | Active: ${u.is_active}`);
      if (u.service_provider) {
        console.log(`  Provider Profile: ID: ${u.service_provider.id} | Approved: ${u.service_provider.is_approved} | Categories: ${u.service_provider.category_ids}`);
      }
    }
  }

  await prisma.$disconnect();
}

run();
