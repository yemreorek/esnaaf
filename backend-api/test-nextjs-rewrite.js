const https = require('https');

const req = https.request('https://partner.esnaaf.com/api/ortak/auth/otp/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let resData = '';
  res.on('data', chunk => resData += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
  });
});

req.on('error', err => console.log('Error: ', err.message));
req.write(JSON.stringify({ phone: '+905329999901', code: '915960' }));
req.end();
