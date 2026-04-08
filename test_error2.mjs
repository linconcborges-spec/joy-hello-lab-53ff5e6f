import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
  } catch (err) {}

  await new Promise(r => setTimeout(r, 2000));
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log('Page Text:', text.slice(0, 500));
  
  await browser.close();
})();
