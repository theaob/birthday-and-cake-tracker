const http = require('http');

// This script simulates an external Cron service that hits your /api/cron endpoint.
// In a real production environment, you might deploy this app to Vercel and use Vercel Cron Jobs,
// or use a cron runner (e.g. GitHub Actions, AWS EventBridge) to hit this URL with the proper Authorization header.

console.log('Triggering daily birthday checking cron... 🕒');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/cron',
  method: 'GET',
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Response Status: ${res.statusCode}`);
    console.log(`Response Body: ${data}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
