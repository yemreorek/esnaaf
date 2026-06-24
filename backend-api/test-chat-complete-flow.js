const http = require('http');
const crypto = require('crypto');

const API_URL = 'http://localhost:3005';

function request(path, method, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = `${API_URL}${path}`;
    const parsedUrl = new URL(url);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.pathname + parsedUrl.search,
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
  const sessionId = crypto.randomUUID();
  console.log(`Session ID: ${sessionId}`);

  try {
    // 1. Start Session
    console.log('\n--- 1. Start Session ---');
    const start = await request('/api/ortak/chat/anonim/baslat', 'POST', { 'X-Session-ID': sessionId });
    console.log('Status:', start.statusCode);
    console.log('Body:', start.data);

    // 2. Send Category "su tesisatı"
    console.log('\n--- 2. Send Category "su tesisatı" ---');
    const cat = await request('/api/musteri/chat/mesaj', 'POST', { 'X-Session-ID': sessionId }, { message: 'su tesisatı' });
    console.log('Response:', cat.data);

    // 3. Send District "Seyhan"
    console.log('\n--- 3. Send District "Seyhan" ---');
    const dist = await request('/api/musteri/chat/mesaj', 'POST', { 'X-Session-ID': sessionId }, { message: 'Seyhan' });
    console.log('Response:', dist.data);

    // 4. Send Details "lavabo tıkandı su sızdırıyor"
    console.log('\n--- 4. Send Details ---');
    const details = await request('/api/musteri/chat/mesaj', 'POST', { 'X-Session-ID': sessionId }, { message: 'lavabo tıkandı su sızdırıyor' });
    console.log('Response:', details.data);

    // 5. Send Name "Asaf Müşteri"
    console.log('\n--- 5. Send Name ---');
    const name = await request('/api/musteri/chat/mesaj', 'POST', { 'X-Session-ID': sessionId }, { message: 'Asaf Müşteri' });
    console.log('Response:', name.data);

    // 6. Send Phone "05554443322"
    console.log('\n--- 6. Send Phone ---');
    const phone = await request('/api/musteri/chat/mesaj', 'POST', { 'X-Session-ID': sessionId }, { message: '05554443322' });
    console.log('Response:', phone.data);

    // Parse OTP
    const phoneData = JSON.parse(phone.data);
    const otpMsg = phoneData.responseMessage || '';
    const match = otpMsg.match(/Geliştirme için:\s*(\d+)/i);
    if (!match) {
      console.log('Failed to parse OTP code from response!');
      return;
    }
    const otpCode = match[1];
    console.log(`Parsed OTP Code: ${otpCode}`);

    // 7. Send OTP
    console.log(`\n--- 7. Send OTP "${otpCode}" ---`);
    const otp = await request('/api/musteri/chat/mesaj', 'POST', { 'X-Session-ID': sessionId }, { message: otpCode });
    console.log('Response Status:', otp.statusCode);
    console.log('OTP Response:', otp.data);

    const otpDataResponse = JSON.parse(otp.data);
    const accessToken = otpDataResponse.accessToken;
    console.log('User Role from Verification:', otpDataResponse.user.role);
    console.log('Access Token generated:', !!accessToken);

    // 8. Confirm Request
    console.log('\n--- 8. Send Confirm "Onayla" ---');
    const confirm = await request('/api/musteri/chat/mesaj', 'POST', {
      'X-Session-ID': sessionId,
      'Authorization': `Bearer ${accessToken}`
    }, { message: 'Onayla' });
    console.log('Response Status:', confirm.statusCode);
    console.log('Response:', confirm.data);

    const confirmData = JSON.parse(confirm.data);
    const jobId = confirmData.jobId;
    console.log(`Created Job ID: ${jobId}`);

    // 9. Query Seeker Requests to verify listability
    console.log('\n--- 9. Query Seeker Requests via API ---');
    const getReqs = await request('/api/musteri/talepler', 'GET', {
      'Authorization': `Bearer ${accessToken}`
    });
    console.log('GET /api/musteri/talepler status:', getReqs.statusCode);
    console.log('GET /api/musteri/talepler body:', getReqs.data.substring(0, 1000));

    const reqsList = JSON.parse(getReqs.data);
    const foundJob = reqsList.find(r => r.id === jobId);
    console.log('\n=== RESULT ===');
    if (foundJob) {
      console.log('🎉 SUCCESS! The request is correctly listed in the seeker requests list.');
      console.log(`Job Status: ${foundJob.status}`);
      console.log(`Job Category: ${foundJob.category.name}`);
      console.log(`Offers count: ${foundJob.offers?.length || 0}`);
    } else {
      console.log('❌ FAILURE! The request was NOT found in the seeker requests list.');
    }

  } catch (err) {
    console.error('Flow failed:', err);
  }
}

run();
