const https = require('https');

const options = {
  hostname: 'api.github.com',
  path: '/repos/yemreorek/esnaaf/actions/runs?per_page=5',
  headers: {
    'User-Agent': 'NodeJS-App'
  }
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log("Latest Action Runs:");
      (result.workflow_runs || []).forEach(run => {
        console.log(`- ID: ${run.id}, Workflow: ${run.name}, Status: ${run.status}, Conclusion: ${run.conclusion}, Commit: ${run.head_commit?.message}`);
      });
    } catch (e) {
      console.error(e);
    }
  });
});
