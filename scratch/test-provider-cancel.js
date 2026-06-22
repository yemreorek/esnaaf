const { PrismaClient } = require('c:/Users/HaTicEmRe/OneDrive/Masaüstü/esnaaf/backend-api/node_modules/@prisma/client');
const http = require('http');
const crypto = require('crypto');
const path = require('path');
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

function decryptPhone(encryptedPhone) {
  if (!encryptedPhone) return '';
  try {
    const { key, iv } = getKeys();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedPhone, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    return encryptedPhone;
  }
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
  console.log('--- STARTING PROVIDER CANCEL INTEGRATION TEST ---');
  try {
    // 1. Find provider Ahmet Usta
    const providerUser = await prisma.user.findFirst({
      where: { name: 'Ahmet Usta', role: 'service_provider' }
    });
    if (!providerUser) {
      throw new Error('Provider Ahmet Usta not found in database!');
    }
    const decryptedProviderPhone = decryptPhone(providerUser.phone);
    console.log(`Ahmet Usta Phone: ${decryptedProviderPhone}`);

    // Find provider profile
    const providerProfile = await prisma.serviceProvider.findUnique({
      where: { user_id: providerUser.id }
    });
    if (!providerProfile) {
      throw new Error('Provider Profile not found!');
    }

    // 2. Find or create a seeker user
    let seekerUser = await prisma.user.findFirst({
      where: { role: 'service_seeker' }
    });
    if (!seekerUser) {
      console.log('Creating mock seeker user...');
      seekerUser = await prisma.user.create({
        data: {
          name: 'Müşteri Test',
          phone: encryptPhone('+905359330454'),
          phone_masked: '0535 *** ** 54',
          role: 'service_seeker',
          is_phone_verified: true
        }
      });
    }

    // 3. Find first category
    const category = await prisma.category.findFirst();
    if (!category) {
      throw new Error('No categories found in database!');
    }

    // 4. Create an active ServiceRequest
    console.log('Creating test ServiceRequest...');
    const requestItem = await prisma.serviceRequest.create({
      data: {
        seeker_id: seekerUser.id,
        category_id: category.id,
        status: 'distributed',
        form_data: {
          name: seekerUser.name,
          details: 'Test iptal iş detayları',
          district: 'Seyhan',
          city: 'Adana'
        }
      }
    });

    // 5. Create an Offer from Ahmet Usta
    console.log('Creating test Offer...');
    const offer = await prisma.offer.create({
      data: {
        job_id: requestItem.id,
        provider_id: providerProfile.id,
        price: 2500,
        message: 'Test boya badana teklif açıklaması',
        status: 'accepted'
      }
    });

    // 6. Create an AcceptedOffer linking them
    console.log('Creating test AcceptedOffer...');
    const acceptedOffer = await prisma.acceptedOffer.create({
      data: {
        job: { connect: { id: requestItem.id } },
        offer: { connect: { id: offer.id } },
        seeker: { connect: { id: seekerUser.id } },
        provider: { connect: { id: providerProfile.id } }
      }
    });

    console.log(`Setup complete. Created request: ${requestItem.id}, offer: ${offer.id}, acceptedOffer: ${acceptedOffer.id}`);

    // 7. Login Ahmet Usta to get access token
    console.log('Logging in Ahmet Usta...');
    // Request OTP first to verify (though seed might work, verify directly bypasses OTP code or we can verify with 123456)
    const loginRes = await request('/api/ortak/auth/otp/verify', 'POST', {}, {
      phone: decryptedProviderPhone,
      code: '123456'
    });

    console.log(`Login Status: ${loginRes.statusCode}`);
    if (loginRes.statusCode !== 200 && loginRes.statusCode !== 201) {
      throw new Error(`Login failed: ${loginRes.data}`);
    }
    const { accessToken } = JSON.parse(loginRes.data);
    console.log('Login successful, accessToken obtained.');

    // 8. Call single provider cancellation endpoint
    console.log('Calling cancellation endpoint /api/hizmetveren/kazanilan-isler/:id/iptal ...');
    const cancelRes = await request(`/api/hizmetveren/kazanilan-isler/${acceptedOffer.id}/iptal`, 'POST', {
      'Authorization': `Bearer ${accessToken}`
    }, {
      reasonCode: 'musteri-ulasilamiyor'
    });

    console.log(`Cancel Endpoint Response Status: ${cancelRes.statusCode}`);
    console.log('Response body:', cancelRes.data);

    if (cancelRes.statusCode !== 200 && cancelRes.statusCode !== 201) {
      throw new Error(`Cancel endpoint failed with status ${cancelRes.statusCode}`);
    }

    // 9. Query database and assert
    console.log('Verifying updates in database...');
    const updatedOffer = await prisma.offer.findUnique({
      where: { id: offer.id }
    });
    const updatedRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestItem.id }
    });

    console.log('Offer status (expected: cancelled):', updatedOffer.status);
    console.log('Offer cancelled_by (expected: service_provider):', updatedOffer.cancelled_by);
    console.log('Offer cancel_reason_code (expected: musteri-ulasilamiyor):', updatedOffer.cancel_reason_code);
    console.log('Request status (expected: cancelled):', updatedRequest.status);

    if (updatedOffer.status !== 'cancelled' || updatedRequest.status !== 'cancelled') {
      throw new Error('Database updates were not made correctly!');
    }

    console.log('INTEGRATION TEST PASSED SUCCESSFULLY!');

  } catch (err) {
    console.error('INTEGRATION TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

run();
