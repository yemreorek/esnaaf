const https = require('https');

const data = JSON.stringify({
  phone: '+905329999901',
  code: '915960'
});

const req = https.request('https://esnaaf-backend-339090537138.europe-west3.run.app/api/ortak/auth/otp/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let resData = '';
  res.on('data', chunk => resData += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response: ${resData}`);
    console.log(`Headers:`, res.headers);
  });
});

req.on('error', err => console.log('Error: ', err.message));
req.write(data);
req.end();
