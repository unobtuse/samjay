const puppeteer = require('puppeteer');

async function fetchNewsImages() {
  const rssUrl = "https://news.google.com/rss/search?q=Sam+Jay+Comedian&hl=en-US&gl=US&ceid=US:en";
  
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // 1. Fetch RSS content using page to avoid CORS/Headers issues
    await page.goto(rssUrl, { waitUntil: 'domcontentloaded' });
    
    const xmlContent = await page.evaluate(() => document.body.innerText);
    
    // Basic XML parsing in Node (using regex to avoid external deps for this simple task)
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title>(.*?)<\/title>/;
    const linkRegex = /<link>(.*?)<\/link>/;
    const dateRegex = /<pubDate>(.*?)<\/pubDate>/;
    const sourceRegex = /<source[^>]*>(.*?)<\/source>/;
    
    let match;
    let count = 0;
    const maxItems = 6;
    
    while ((match = itemRegex.exec(xmlContent)) !== null && count < maxItems) {
        const itemContent = match[1];
        const title = (itemContent.match(titleRegex) || [])[1] || '';
        const link = (itemContent.match(linkRegex) || [])[1] || '';
        const pubDate = (itemContent.match(dateRegex) || [])[1] || '';
        const source = (itemContent.match(sourceRegex) || [])[1] || '';
        
        items.push({ title, link, pubDate, source, image: null });
        count++;
    }
    
    // 2. Process each item to resolve redirect and get OG Image
    const results = [];
    
    for (const item of items) {
        try {
            const itemPage = await browser.newPage();
            await itemPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // Navigate and wait for redirect to complete
            await itemPage.goto(item.link, { waitUntil: 'domcontentloaded', timeout: 15000 });
            
            // Get final URL
            const finalUrl = itemPage.url();
            
            // Extract OG Image
            const ogImage = await itemPage.evaluate(() => {
                const og = document.querySelector('meta[property="og:image"]');
                if (og) return og.content;
                const twitter = document.querySelector('meta[name="twitter:image"]');
                if (twitter) return twitter.content;
                return null;
            });
            
            results.push({
                title: item.title,
                link: finalUrl,
                date: new Date(item.pubDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                source: item.source,
                image: ogImage
            });
            
            await itemPage.close();
        } catch (err) {
            // Fallback if navigation fails
            results.push({
                title: item.title,
                link: item.link,
                date: item.pubDate,
                source: item.source,
                image: null,
                error: err.message
            });
        }
    }
    
    console.log(JSON.stringify(results));
    
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
  } finally {
    await browser.close();
  }
}

fetchNewsImages();
