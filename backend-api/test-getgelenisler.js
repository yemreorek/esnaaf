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
  const req = await prisma.serviceRequest.findFirst({
    orderBy: { created_at: 'desc' }
  });
  
  const kemal = await prisma.user.findFirst({ where: { name: { contains: 'kemal', mode: 'insensitive' } } });
  const provider = await prisma.serviceProvider.findUnique({ where: { user_id: kemal.id }});

  console.log(`Checking getGelenIsler for Provider ID: ${provider.id} for Job ID: ${req.id}`);

  const responseTimes = await prisma.responseTime.findMany({
    where: { 
      provider_id: provider.id,
      notified_at: { lte: new Date() },
    },
    orderBy: { notified_at: 'desc' },
  });
  
  console.log(`Found ${responseTimes.length} responseTime records <= new Date()`);

  for (const rt of responseTimes) {
    if (rt.job_id !== req.id) continue;
    console.log(`\nAnalyzing Polat Job (rt_id: ${rt.id}):`);

    const job = await prisma.serviceRequest.findUnique({
      where: { id: rt.job_id },
      include: { offers: { where: { provider_id: provider.id } } },
    });

    if (!job) { console.log('Job not found'); continue; }
    if (job.status === 'completed' || job.status === 'cancelled') { console.log(`Job status is ${job.status}`); continue; }
    if (job.offers.length > 0) { console.log('Already offered'); continue; }

    const acceptedOffer = await prisma.offer.findFirst({ where: { job_id: job.id, status: 'accepted' } });
    if (acceptedOffer) { console.log('Has accepted offer'); continue; }

    const jobOffers = await prisma.offer.findMany({ where: { job_id: job.id }, select: { created_at: true } });
    const offersCount = jobOffers.length;

    const { isExpired, expiresTime } = getRequestExpiryInfo(job.created_at, Date.now(), jobOffers);
    console.log(`offersCount: ${offersCount}`);
    console.log(`isExpired: ${isExpired}`);
    console.log(`expiresTime: ${new Date(expiresTime).toISOString()}`);
    console.log(`Date.now(): ${new Date().toISOString()}`);

    if (offersCount >= 4 || isExpired) {
      console.log('Skipping because offersCount >= 4 OR isExpired === true');
      continue;
    }
    
    console.log('JOB SHOULD BE VISIBLE!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
