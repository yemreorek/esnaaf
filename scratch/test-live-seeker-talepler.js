const https = require('https');

const API_URL = 'https://esnaaf-backend-339090537138.europe-west3.run.app';

function request(path, method, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = `${API_URL}${path}`;
    const parsedUrl = new URL(url);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
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
  try {
    // We need to log in as the seeker we just created (+905359330454) using bypass code 123456
    console.log('--- 1. Login as Seeker ---');
    const loginRes = await request('/api/ortak/auth/otp/verify', 'POST', {}, {
      phone: '+905359330454',
      code: '123456'
    });
    console.log(`Login Status: ${loginRes.statusCode}`);
    const loginData = JSON.parse(loginRes.data);

    if (!loginData.accessToken) {
      console.log('Error: Failed to obtain seeker access token!');
      return;
    }
    const token = loginData.accessToken;

    console.log('\n--- 2. Fetch Seeker Requests ---');
    const reqRes = await request('/api/musteri/talepler', 'GET', {
      'Authorization': `Bearer ${token}`
    });
    console.log(`Requests Status: ${reqRes.statusCode}`);
    console.log('Requests Response:', reqRes.data);

  } catch (err) {
    console.error('Test failed:', err);
  }
}

run();
