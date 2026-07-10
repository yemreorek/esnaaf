const https = require('https');

https.get('https://api.github.com/repos/yemreorek/esnaaf/actions/runs?per_page=1', {
  headers: {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'node.js'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const runs = JSON.parse(data).workflow_runs;
    if (runs && runs.length > 0) {
      console.log(`Status: ${runs[0].status}`);
      console.log(`Conclusion: ${runs[0].conclusion}`);
      console.log(`Created At: ${runs[0].created_at}`);
      console.log(`Updated At: ${runs[0].updated_at}`);
    } else {
      console.log('No runs found.');
    }
  });
}).on('error', err => console.log('Error: ', err.message));
