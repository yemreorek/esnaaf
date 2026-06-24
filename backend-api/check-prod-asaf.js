const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'
    }
  }
});

const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = Buffer.from('some_super_secret_phone_enc_key_32bytes!', 'utf8');
const iv = Buffer.from('1234567890123456', 'utf8');

function decryptPhone(text) {
  if (!text) return '';
  try {
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return text;
  }
}

async function run() {
  console.log("=== ALL USERS IN PROD ===");
  const users = await prisma.user.findMany({
    include: {
      service_provider: true
    }
  });
  
  for (const u of users) {
    console.log(`User ID: ${u.id} | Name: ${u.name} | Role: ${u.role} | Active: ${u.is_active} | Has Provider Profile: ${!!u.service_provider}`);
  }

  console.log("\n=== SEARCHING FOR 'ASAF' IN PROD ===");
  const asafUsers = users.filter(u => u.name && u.name.toLowerCase().includes('asaf'));
  if (asafUsers.length === 0) {
    console.log("No user found with name containing 'asaf'");
  } else {
    for (const u of asafUsers) {
      console.log(`Found: ID: ${u.id} | Name: ${u.name} | Role: ${u.role} | Active: ${u.is_active}`);
      if (u.service_provider) {
        console.log(`  Provider Profile: ID: ${u.service_provider.id} | Approved: ${u.service_provider.is_approved} | Categories: ${u.service_provider.category_ids} | City: ${u.service_provider.city}`);
      }
    }
  }

  console.log("\n=== SEARCHING FOR RECENT SU TESISATI REQUESTS IN PROD ===");
  const requests = await prisma.serviceRequest.findMany({
    include: {
      category: true,
      seeker: true,
      offers: {
        include: {
          provider: {
            include: {
              user: true
            }
          }
        }
      }
    },
    orderBy: {
      created_at: 'desc'
    },
    take: 10
  });

  const suTesisatiReqs = requests.filter(r => r.category.name.includes("Su Tesisatı"));
  console.log(`Found ${suTesisatiReqs.length} recent Su Tesisatı requests:`);
  for (const r of suTesisatiReqs) {
    console.log(`Request ID: ${r.id} | Seeker: ${r.seeker.name} | Status: ${r.status} | Form Data: ${JSON.stringify(r.form_data)} | Created: ${r.created_at}`);
    console.log(`  Offers count: ${r.offers.length}`);
    for (const o of r.offers) {
      console.log(`    Offer ID: ${o.id} | Provider: ${o.provider.user.name} | Price: ${o.price} | Status: ${o.status}`);
    }
  }

  await prisma.$disconnect();
}

run().catch(console.error);
