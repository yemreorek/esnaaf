const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient({datasources: {db: {url: 'postgresql://postgres:EsnaafProdDbPass2026!@34.159.44.2:5432/esnaaf_db?schema=public'}}});

function getRequestExpiryInfo(createdAt, compareWith, offers = []) {
  const createdDate = new Date(createdAt);
  const localTime = new Date(createdDate.getTime() + 3 * 60 * 60 * 1000);
  const hour = localTime.getUTCHours();
  const isNight = hour >= 18 || hour < 10;
  
  let initialExpiresTime = 0;
  if (isNight) {
    const targetDate = new Date(localTime.getTime());
    if (hour >= 18) {
      targetDate.setUTCDate(targetDate.getUTCDate() + 1);
    }
    const tYear = targetDate.getUTCFullYear();
    const tMonth = (targetDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const tDay = targetDate.getUTCDate().toString().padStart(2, '0');
    const istanbul10AMIso = `${tYear}-${tMonth}-${tDay}T10:00:00+03:00`;
    initialExpiresTime = new Date(istanbul10AMIso).getTime();
  } else {
    initialExpiresTime = createdDate.getTime() + 30 * 60 * 1000;
  }

  const offersBeforeExpiry = (offers || []).filter(o => {
    const offerTime = o.created_at ? new Date(o.created_at).getTime() : 0;
    return offerTime > 0 && offerTime < initialExpiresTime;
  });
  const hasOffersBeforeExpiry = offersBeforeExpiry.length > 0;

  let expiresTime = initialExpiresTime;
  if (!hasOffersBeforeExpiry) {
    expiresTime = initialExpiresTime + 15 * 60 * 1000;
  }

  const isExpired = expiresTime <= compareWith;
  return { expiresTime, isExpired, initialExpiresTime };
}

async function main() {
  const job = await prisma.serviceRequest.findUnique({
    where: { id: "792a5d6e-3c26-45b2-8c4a-9217aa91e508" }
  });
  
  const { isExpired, expiresTime } = getRequestExpiryInfo(job.created_at, Date.now(), []);
  console.log(`Job Created at: ${new Date(job.created_at).toISOString()}`);
  console.log(`Expires Time: ${new Date(expiresTime).toISOString()}`);
  console.log(`Date.now(): ${new Date().toISOString()}`);
  console.log(`Is Expired: ${isExpired}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
