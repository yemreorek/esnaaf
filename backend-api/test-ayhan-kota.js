const https = require('https');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3NmNkZDFkZi1kMThkLTRiZmEtODVmOC0wM2RmNGQ1MDIzMmIiLCJwaG9uZSI6IjQzZTdiNGVjNDYwOTlkNGY1YmQ2NDVkYzUxYTk5N2JkIiwicm9sZSI6InNlcnZpY2VfcHJvdmlkZXIiLCJpYXQiOjE3ODM3MDAwMzcsImV4cCI6MTc4MzcwMDkzN30.CqOFJb3fa-cQjnFWoHDIxXU6ZYDvx9XS50I-a6bNGb8";

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
