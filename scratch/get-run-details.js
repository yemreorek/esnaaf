const https = require('https');

const options = {
  hostname: 'api.github.com',
  path: '/repos/yemreorek/esnaaf/actions/runs/27437845122',
  headers: {
    'User-Agent': 'NodeJS-App'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const run = JSON.parse(data);
      console.log("Run Details:");
      console.log("- Status:", run.status);
      console.log("- Conclusion:", run.conclusion);
      console.log("- Created At:", run.created_at);
      console.log("- Updated At:", run.updated_at);
      
      const updatedAtDate = new Date(run.updated_at);
      console.log("- Updated At (Turkey Local Time):", updatedAtDate.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" }));
    } catch (e) {
      console.error(e);
    }
  });
});
