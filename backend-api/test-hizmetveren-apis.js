const https = require('https');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzNDYxN2YxYS1lMjY0LTRhZmEtOTM4ZC02MThkNTM0YjVjYjYiLCJwaG9uZSI6Ijc1M2VjMWNmOTNhMjIyNjllNjdlYjQwZmMxMzBjZjIwIiwicm9sZSI6InNlcnZpY2VfcHJvdmlkZXIiLCJpYXQiOjE3ODM2OTk2MjAsImV4cCI6MTc4MzcwMDUyMH0.rL2nzUKaGc59SgkWe9UgxSiMkvXlpb_cyVnWL0xx93M";

const req = https.request('https://esnaaf-backend-339090537138.europe-west3.run.app/api/hizmetveren/kota', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
}, (res) => {
  let resData = '';
  res.on('data', chunk => resData += chunk);
  res.on('end', () => {
    console.log(`Status (kota): ${res.statusCode}`);
    console.log(`Response (kota): ${resData}`);
  });
});

req.on('error', err => console.log('Error: ', err.message));
req.end();

const req2 = https.request('https://esnaaf-backend-339090537138.europe-west3.run.app/api/hizmetveren/gelen-isler', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
}, (res) => {
  let resData = '';
  res.on('data', chunk => resData += chunk);
  res.on('end', () => {
    console.log(`Status (gelen-isler): ${res.statusCode}`);
    console.log(`Response (gelen-isler): ${resData}`);
  });
});

req2.on('error', err => console.log('Error: ', err.message));
req2.end();
