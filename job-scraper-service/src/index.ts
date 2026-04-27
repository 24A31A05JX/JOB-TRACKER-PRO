import express, { Request, Response } from 'express';
import cors from 'cors';
import { chromium } from 'playwright';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    message: 'Job Scraper Service is running. Use POST /api/scrape to extract data.',
    version: '1.0'
  });
});

app.post('/api/scrape', async (req: Request, res: Response) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  try {
    console.log(`Starting scrape for URL: ${url}`);
    
    // Launch headless Chromium
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    
    const page = await context.newPage();
    
    // Go to the URL and wait for DOM content to load
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Extract basic page text. Wait slightly for dynamic content if needed
    await page.waitForTimeout(2000); 

    // We can extract title, company name, and raw text
    const pageTitle = await page.title();
    const rawText = await page.evaluate(() => document.body.innerText);
    
    await browser.close();

    // In a real robust scraper, we'd use specific selectors per domain (LinkedIn, Indeed, etc.)
    // For now, we return the raw text block, which the Gemini AI on the Next.js side can parse easily!

    res.json({
      success: true,
      data: {
        pageTitle,
        content: rawText.substring(0, 15000), // Cap length to avoid massive payloads
        sourceUrl: url
      }
    });

  } catch (error: any) {
    console.error('Scraping Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to scrape URL' });
  }
});

app.listen(PORT, () => {
  console.log(`Job Scraper Service is running locally on http://localhost:${PORT}`);
});
