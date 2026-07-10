const https = require('https');

const req = https.request('https://esnaaf-backend-339090537138.europe-west3.run.app/api/ortak/auth/otp/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  let resData = '';
  res.on('data', chunk => resData += chunk);
  res.on('end', () => {
    console.log(`Response: ${resData}`);
  });
});

req.on('error', err => console.log('Error: ', err.message));
req.write(JSON.stringify({ phone: '+905329999901' }));
req.end();
