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

async function main() {
  try {
    console.log("Fetching partner.esnaaf.com...");
    const html = await fetchUrl('https://partner.esnaaf.com/?cb=' + Date.now());
    
    // Find buildId by looking for _buildManifest.js
    const manifestMatch = html.match(/\"buildId\":\"([^\"]+)\"/);
    if (!manifestMatch) {
      console.log("Could not find buildId in HTML.");
      // Fallback: search for static path directly
      const staticMatch = html.match(/_next\/static\/([a-zA-Z0-9_\-]+)\/_buildManifest\.js/);
      if (staticMatch) {
        console.log("Found buildId from static path:", staticMatch[1]);
        await checkManifest(staticMatch[1]);
      } else {
        console.log("Could not find manifest path.");
      }
      return;
    }
    const buildId = manifestMatch[1];
    console.log("Found buildId:", buildId);
    await checkManifest(buildId);
  } catch (err) {
    console.error(err);
  }
}

async function checkManifest(buildId) {
  const manifestUrl = `https://partner.esnaaf.com/_next/static/${buildId}/_buildManifest.js`;
  console.log(`Fetching manifest from: ${manifestUrl}`);
  const manifestJs = await fetchUrl(manifestUrl);
  
  // Extract chunks list from manifest
  // Standard Next.js manifest lists paths for each route.
  // We can look for chunk files listed in the JS.
  const regex = /static\/chunks\/[a-zA-Z0-9_\-\/]+\.js/g;
  const chunks = Array.from(new Set(manifestJs.match(regex) || []));
  console.log(`Found ${chunks.length} chunks in build manifest.`);
  
  let foundNew = false;
  let foundOld = false;
  
  for (const chunk of chunks) {
    const url = `https://partner.esnaaf.com/_next/${chunk}`;
    console.log(`Checking chunk: ${url}`);
    try {
      const content = await fetchUrl(url);
      if (content.includes('paddedBase64') || content.includes('msgSenderId')) {
        console.log(`\n🎉 🎉 🎉 FOUND NEW CODE IN CHUNK: ${chunk}`);
        foundNew = true;
      }
      if (content.includes('seekerUserId')) {
        console.log(`\n🔴 🔴 🔴 FOUND OLD CODE IN CHUNK: ${chunk}`);
        foundOld = true;
      }
    } catch (e) {
      console.error(`Failed to fetch ${url}`);
    }
  }
  
  console.log("\n--- Manifest Scan Status ---");
  console.log("New Code Live:", foundNew);
  console.log("Old Code Live:", foundOld);
}

main();
