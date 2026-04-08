import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser Error Console:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('Browser Page Error:', err.message);
  });

  try {
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
  } catch (err) {
    console.error('Navigation error:', err.message);
  }

  await new Promise(r => setTimeout(r, 2000));
  
  const rootInnerHTML = await page.evaluate(() => document.getElementById('root')?.innerHTML);
  console.log('Root innerHTML length:', rootInnerHTML?.length);
  if (rootInnerHTML && rootInnerHTML.length < 500) {
    console.log('Root content:', rootInnerHTML);
  }
  
  await browser.close();
})();
