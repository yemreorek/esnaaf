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
    console.log("Fetching partner.esnaaf.com index page...");
    const html = await fetchUrl('https://partner.esnaaf.com');
    
    // Extract all JS files referenced in script tags or Next.js preload links
    const regex = /_next\/static\/[a-zA-Z0-9_\-\/]+\.js/g;
    const matches = Array.from(new Set(html.match(regex) || []));
    console.log(`Found ${matches.length} unique JS file references.`);
    
    let foundNew = false;
    let foundOld = false;
    
    for (const chunkPath of matches) {
      const chunkUrl = `https://partner.esnaaf.com/${chunkPath}`;
      const jsContent = await fetchUrl(chunkUrl);
      
      if (jsContent.includes('seekerUserId')) {
        console.log(`-> Found OLD code ('seekerUserId') in: ${chunkPath}`);
        foundOld = true;
      }
      if (jsContent.includes('paddedBase64') || jsContent.includes('msgSenderId')) {
        console.log(`-> Found NEW code ('paddedBase64'/'msgSenderId') in: ${chunkPath}`);
        foundNew = true;
      }
    }
    
    console.log("\n--- Diagnostic Summary ---");
    console.log("Is old code still present?", foundOld);
    console.log("Is new code deployed?", foundNew);
    
  } catch (err) {
    console.error("Error during check:", err);
  }
}

main();
