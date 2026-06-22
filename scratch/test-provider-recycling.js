const { PrismaClient } = require('c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/backend-api/node_modules/@prisma/client');
const http = require('http');
const crypto = require('crypto');
const dotenv = require('c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/backend-api/node_modules/dotenv');

// Load environment variables from backend-api/.env
dotenv.config({ path: 'c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/backend-api/.env' });

const prisma = new PrismaClient();

const ALGORITHM = 'aes-256-cbc';
function getKeys() {
  const key = process.env.ENCRYPTION_KEY || 'default_32_chars_long_key_12345';
  const iv = process.env.ENCRYPTION_IV || 'default_16_ch_iv';
  return {
    key: Buffer.from(key.substring(0, 32).padEnd(32, 'a')),
    iv: Buffer.from(iv.substring(0, 16).padEnd(16, 'b')),
  };
}

function encryptPhone(phone) {
  if (!phone) return '';
  const { key, iv } = getKeys();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(phone, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function request(path, method, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3005,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log('--- STARTING PROVIDER OFFER RECYCLING & STATE MANAGEMENT INTEGRATION TEST ---');
  try {
    // 1. Setup/Verify Provider 1: Ahmet Usta
    const provider1User = await prisma.user.findFirst({
      where: { name: 'Ahmet Usta', role: 'service_provider' }
    });
    if (!provider1User) {
      throw new Error('Provider Ahmet Usta not found in database!');
    }
    const provider1Profile = await prisma.serviceProvider.findUnique({
      where: { user_id: provider1User.id }
    });
    if (!provider1Profile) {
      throw new Error('Ahmet Usta provider profile not found!');
    }

    // 2. Setup/Verify Provider 2: Mehmet Usta (Create if not exists)
    let provider2User = await prisma.user.findFirst({
      where: { name: 'Mehmet Usta', role: 'service_provider' }
    });
    if (!provider2User) {
      console.log('Creating Provider 2: Mehmet Usta...');
      provider2User = await prisma.user.create({
        data: {
          name: 'Mehmet Usta',
          phone: encryptPhone('+905323330033'),
          phone_masked: '0532 *** ** 33',
          role: 'service_provider'
        }
      });
    }

    let provider2Profile = await prisma.serviceProvider.findUnique({
      where: { user_id: provider2User.id }
    });
    if (!provider2Profile) {
      console.log('Creating Provider 2 profile...');
      provider2Profile = await prisma.serviceProvider.create({
        data: {
          user_id: provider2User.id,
          is_approved: true,
          approved_at: new Date(),
          description: 'Mehmet Usta Boya Badana Hizmetleri'
        }
      });
    }

    // 3. Find or Create seeker user
    let seekerUser = await prisma.user.findFirst({
      where: { phone: encryptPhone('+905359330454'), role: 'service_seeker' }
    });
    if (!seekerUser) {
      console.log('Creating seeker user...');
      seekerUser = await prisma.user.create({
        data: {
          name: 'Müşteri Test',
          phone: encryptPhone('+905359330454'),
          phone_masked: '0535 *** ** 54',
          role: 'service_seeker'
        }
      });
    }

    // 4. Find first category
    const category = await prisma.category.findFirst();
    if (!category) {
      throw new Error('No categories found!');
    }

    // 5. Create an active ServiceRequest
    console.log('Creating test ServiceRequest...');
    const requestItem = await prisma.serviceRequest.create({
      data: {
        seeker_id: seekerUser.id,
        category_id: category.id,
        status: 'distributed',
        form_data: {
          name: seekerUser.name,
          details: 'Dynamic Recycling Test Details',
          district: 'Seyhan',
          city: 'Adana'
        }
      }
    });

    // 6. Create Offer 1 (Ahmet Usta)
    console.log('Creating Offer 1...');
    const offer1 = await prisma.offer.create({
      data: {
        job_id: requestItem.id,
        provider_id: provider1Profile.id,
        price: 2000,
        message: 'Ahmet Usta teklif mesajı',
        status: 'pending'
      }
    });

    // 7. Create Offer 2 (Mehmet Usta)
    console.log('Creating Offer 2...');
    const offer2 = await prisma.offer.create({
      data: {
        job_id: requestItem.id,
        provider_id: provider2Profile.id,
        price: 2500,
        message: 'Mehmet Usta teklif mesajı',
        status: 'pending'
      }
    });

    // 8. Login Seeker
    console.log('Logging in Seeker...');
    const loginRes = await request('/api/ortak/auth/otp/verify', 'POST', {}, {
      phone: '+905359330454',
      code: '123456'
    });
    console.log(`Login status: ${loginRes.statusCode}`);
    const { accessToken } = JSON.parse(loginRes.data);

    // --- PHASE 1: Seeker accepts Offer 1 ---
    console.log('\n--- PHASE 1: Seeker accepts Offer 1 ---');
    const accept1Res = await request(`/api/musteri/teklifler/${offer1.id}/kabul`, 'POST', {
      'Authorization': `Bearer ${accessToken}`
    }, { consent: true });
    console.log(`Accept 1 Status: ${accept1Res.statusCode}`);
    if (accept1Res.statusCode !== 200) {
      throw new Error(`Accept 1 failed: ${accept1Res.data}`);
    }

    // Verify DB state
    let dbOffer1 = await prisma.offer.findUnique({ where: { id: offer1.id } });
    let dbOffer2 = await prisma.offer.findUnique({ where: { id: offer2.id } });
    console.log('Offer 1 status (expected: accepted):', dbOffer1.status);
    console.log('Offer 2 status (expected: pending):', dbOffer2.status);
    if (dbOffer1.status !== 'accepted' || dbOffer2.status !== 'pending') {
      throw new Error('Database state incorrect for Phase 1');
    }

    // --- PHASE 2: Seeker accepts Offer 2 (Fallback Provider 1) ---
    console.log('\n--- PHASE 2: Seeker accepts Offer 2 ---');
    const accept2Res = await request(`/api/musteri/teklifler/${offer2.id}/kabul`, 'POST', {
      'Authorization': `Bearer ${accessToken}`
    }, { consent: true });
    console.log(`Accept 2 Status: ${accept2Res.statusCode}`);
    if (accept2Res.statusCode !== 200) {
      throw new Error(`Accept 2 failed: ${accept2Res.data}`);
    }

    // Verify DB state
    dbOffer1 = await prisma.offer.findUnique({ where: { id: offer1.id } });
    dbOffer2 = await prisma.offer.findUnique({ where: { id: offer2.id } });
    console.log('Offer 1 status (expected: cancelled):', dbOffer1.status);
    console.log('Offer 1 cancelled_by (expected: service_seeker):', dbOffer1.cancelled_by);
    console.log('Offer 1 cancel_reason_code (expected: switch-offer):', dbOffer1.cancel_reason_code);
    console.log('Offer 2 status (expected: accepted):', dbOffer2.status);
    if (dbOffer1.status !== 'cancelled' || dbOffer1.cancelled_by !== 'service_seeker' || dbOffer2.status !== 'accepted') {
      throw new Error('Database state incorrect for Phase 2');
    }

    // --- PHASE 3: Seeker re-accepts Offer 1 (Recycling) ---
    console.log('\n--- PHASE 3: Seeker re-accepts Offer 1 ---');
    const reacceptRes = await request(`/api/musteri/teklifler/${offer1.id}/kabul`, 'POST', {
      'Authorization': `Bearer ${accessToken}`
    }, { consent: true });
    console.log(`Re-accept Status: ${reacceptRes.statusCode}`);
    if (reacceptRes.statusCode !== 200) {
      throw new Error(`Re-accept failed: ${reacceptRes.data}`);
    }

    // Verify DB state
    dbOffer1 = await prisma.offer.findUnique({ where: { id: offer1.id } });
    dbOffer2 = await prisma.offer.findUnique({ where: { id: offer2.id } });
    console.log('Offer 1 status (expected: accepted):', dbOffer1.status);
    console.log('Offer 1 cancelled_by (expected: null):', dbOffer1.cancelled_by);
    console.log('Offer 2 status (expected: cancelled):', dbOffer2.status);
    console.log('Offer 2 cancelled_by (expected: service_seeker):', dbOffer2.cancelled_by);
    if (dbOffer1.status !== 'accepted' || dbOffer1.cancelled_by !== null || dbOffer2.status !== 'cancelled' || dbOffer2.cancelled_by !== 'service_seeker') {
      throw new Error('Database state incorrect for Phase 3');
    }

    console.log('\nDYNAMIC OFFER RECYCLING INTEGRATION TEST PASSED SUCCESSFULLY!');

  } catch (err) {
    console.error('\nINTEGRATION TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

run();
