const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- DB TIMESTAMPS AND LOGS INSPECTOR ---');
  
  const jobId = 'f1612bc7'; 
  const job = await prisma.serviceRequest.findFirst({
    where: {
      id: {
        startsWith: jobId
      }
    },
    include: {
      offers: true
    }
  });

  if (!job) {
    console.error('Job not found in database with ID prefix:', jobId);
    return;
  }

  console.log('--- FOUND JOB DETAILS ---');
  console.log('Job ID:', job.id);
  console.log('Created At (UTC in DB):', job.created_at);
  console.log('Created At Local String:', new Date(job.created_at).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }));
  console.log('Current System Time (UTC):', new Date().toISOString());
  console.log('Current System Time Local:', new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }));
  console.log('Offers count:', job.offers.length);
  
  job.offers.forEach((o, i) => {
    console.log(`Offer ${i+1}: ID=${o.id}, Status=${o.status}, CreatedAt=${o.created_at}`);
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
