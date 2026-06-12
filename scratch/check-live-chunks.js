const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

const chunks = [
  '/_next/static/chunks/03cnjj9mnzy_p.js',
  '/_next/static/chunks/07lhk_q6pmm3r.js',
  '/_next/static/chunks/turbopack-0bxcrz71-nfi1.js',
  '/_next/static/chunks/0dbhjjzl8qfwv.js',
  '/_next/static/chunks/0tdwl-j~p_5~z.js',
  '/_next/static/chunks/0jrynxmcvpajh.js'
];

async function main() {
  try {
    let foundNew = false;
    let foundOld = false;

    for (const chunk of chunks) {
      const url = `https://partner.esnaaf.com${chunk}`;
      console.log(`Checking chunk: ${url}`);
      try {
        const content = await fetchUrl(url);
        if (content.includes('paddedBase64')) {
          console.log(`🎉 🎉 🎉 FOUND NEW CODE ('paddedBase64') IN: ${chunk}`);
          foundNew = true;
        }
        if (content.includes('seekerUserId')) {
          console.log(`🔴 🔴 🔴 FOUND OLD CODE ('seekerUserId') IN: ${chunk}`);
          foundOld = true;
        }
      } catch (e) {
        console.error(`Failed to fetch ${url}`);
      }
    }
    
    console.log("\n--- Scan Status ---");
    console.log("New Code Live:", foundNew);
    console.log("Old Code Live:", foundOld);
  } catch (err) {
    console.error(err);
  }
}

main();
