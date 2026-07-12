import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

export async function GET() {
  try {
    const res = await fetch(`${apiUrl}/api/ortak/seo/sitemap`, {
      cache: 'no-store'
    });
    
    if (!res.ok) {
      throw new Error('Sitemap fetch failed');
    }
    
    const data = await res.json();
    const links: string[] = data.links || [];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://esnaaf.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${links.map(slug => `  <url>
    <loc>https://esnaaf.com/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=0, must-revalidate'
      }
    });
  } catch (e) {
    console.error('Failed to generate sitemap.xml:', e);
    // Return empty but valid sitemap on error
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://esnaaf.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    
    return new NextResponse(fallbackXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=0, must-revalidate'
      }
    });
  }
}
