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
      const logsUrl = runs[0].logs_url;
      console.log(`Logs URL: ${logsUrl}`);
    }
  });
});
