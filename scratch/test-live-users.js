const https = require('https');

const API_URL = 'https://esnaaf-backend-339090537138.europe-west3.run.app';

function request(path, method, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = `${API_URL}${path}`;
    const parsedUrl = new URL(url);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  try {
    console.log('--- 1. Login as Admin on Live API ---');
    const loginRes = await request('/api/ortak/auth/otp/verify', 'POST', {}, {
      phone: '05991112233',
      code: '123456'
    });
    console.log(`Login Status: ${loginRes.statusCode}`);
    console.log(`Login Response: ${loginRes.data}`);
    const loginData = JSON.parse(loginRes.data);

    if (!loginData.accessToken) {
      console.log('Error: Failed to obtain admin access token!');
      return;
    }
    const token = loginData.accessToken;

    console.log('\n--- 2. Fetch Users List from Live Admin API ---');
    const usersRes = await request('/api/admin/users', 'GET', {
      'Authorization': `Bearer ${token}`
    });
    console.log(`Users Status: ${usersRes.statusCode}`);
    
    const usersData = JSON.parse(usersRes.data);
    const usersList = usersData.users || usersData || [];
    console.log(`Found ${usersList.length} users in database.`);
    
    // Find user Olgun
    const olgunUsers = usersList.filter(u => u.name && u.name.toLowerCase().includes('olgun'));
    console.log('\n--- Users named "Olgun": ---');
    console.log(JSON.stringify(olgunUsers, null, 2));

    // Find all service requests on live admin dashboard/list
    console.log('\n--- 3. Fetch Service Requests from Live Admin API ---');
    // Let's see if there is an endpoint to list requests, or we can check audit logs or dashboard stats.
    const statsRes = await request('/api/admin/dashboard/stats', 'GET', {
      'Authorization': `Bearer ${token}`
    });
    console.log(`Dashboard Stats Status: ${statsRes.statusCode}`);
    console.log('Dashboard Stats:', statsRes.data);

    // Let's check audit logs or recent requests
    const logsRes = await request('/api/admin/audit-logs?page=1&limit=50', 'GET', {
      'Authorization': `Bearer ${token}`
    });
    console.log(`Audit Logs Status: ${logsRes.statusCode}`);
    const logsData = JSON.parse(logsRes.data);
    console.log('Recent Audit Logs count:', logsData.logs ? logsData.logs.length : 0);
    if (logsData.logs) {
      logsData.logs.slice(0, 10).forEach(l => {
        console.log(`Action: ${l.action} | Target: ${l.target_type} | TargetID: ${l.target_id} | CreatedAt: ${l.created_at}`);
      });
    }

  } catch (err) {
    console.error('Test failed:', err);
  }
}

run();
