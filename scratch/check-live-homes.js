const https = require('https');
const http = require('http');

function fetchUrl(url, redirectCount = 0) {
  if (redirectCount > 5) {
    return Promise.reject(new Error("Too many redirects"));
  }
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Cache-Control': 'no-cache'
      }
    }, (res) => {
      console.log(`GET ${url} -> Status: ${res.statusCode}`);
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = new URL(res.headers.location, url).toString();
        return fetchUrl(nextUrl, redirectCount + 1).then(resolve).catch(reject);
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        url,
        statusCode: res.statusCode,
        headers: res.headers,
        body: data
      }));
    }).on('error', reject);
  });
}

async function main() {
  try {
    console.log("=== CHECKING ESNAAF.COM ===");
    const customer = await fetchUrl('https://esnaaf.com');
    console.log("Final URL:", customer.url);
    console.log("Headers:", {
      'cache-control': customer.headers['cache-control'],
      'x-powered-by': customer.headers['x-powered-by']
    });
    
    const customerTitle = customer.body.match(/<title>([^<]+)<\/title>/i);
    console.log("Title:", customerTitle ? customerTitle[1] : "NOT FOUND");
    
    const customerFavicon = customer.body.match(/<link[^>]*rel="[^"]*icon"[^>]*>/i);
    console.log("Favicon tag:", customerFavicon ? customerFavicon[0] : "NOT FOUND");
    
    const hasKomsu = customer.body.includes("Komşu Esnaflarla");
    console.log("Contains 'Komşu Esnaflarla':", hasKomsu);
    
    const hasLogoPng = customer.body.includes("logo.png");
    console.log("Contains 'logo.png':", hasLogoPng);

    console.log("\n=== CHECKING PARTNER.ESNAAF.COM ===");
    const partner = await fetchUrl('https://partner.esnaaf.com');
    console.log("Final URL:", partner.url);
    console.log("Headers:", {
      'cache-control': partner.headers['cache-control'],
      'x-powered-by': partner.headers['x-powered-by']
    });
    
    const partnerTitle = partner.body.match(/<title>([^<]+)<\/title>/i);
    console.log("Title:", partnerTitle ? partnerTitle[1] : "NOT FOUND");
    
    const partnerFavicon = partner.body.match(/<link[^>]*rel="[^"]*icon"[^>]*>/i);
    console.log("Favicon tag:", partnerFavicon ? partnerFavicon[0] : "NOT FOUND");
    
  } catch (err) {
    console.error("Error during check:", err);
  }
}

main();
