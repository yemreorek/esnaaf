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
      const jobsUrl = runs[0].jobs_url;
      console.log(`Jobs URL: ${jobsUrl}`);
      
      https.get(jobsUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'node.js'
        }
      }, (res2) => {
        let data2 = '';
        res2.on('data', chunk => data2 += chunk);
        res2.on('end', () => {
          const jobs = JSON.parse(data2).jobs;
          if (jobs) {
            jobs.forEach(job => {
              console.log(`Job: ${job.name} | Status: ${job.status} | Conclusion: ${job.conclusion}`);
              if (job.conclusion === 'failure') {
                console.log(`Failed steps:`);
                job.steps.forEach(step => {
                  if (step.conclusion === 'failure') {
                    console.log(`- ${step.name}`);
                  }
                });
              }
            });
          }
        });
      });
    }
  });
});
