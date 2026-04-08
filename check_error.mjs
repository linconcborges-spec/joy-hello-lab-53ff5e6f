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
    await page.goto('http://localhost:3333/', { waitUntil: 'networkidle' });
    console.log('Navigation complete.');
  } catch (err) {
    console.error('Navigation error:', err.message);
  }

  await new Promise(r => setTimeout(r, 2000)); // wait extra 2s to catch deferred errors
  const content = await page.content();
  if (content.includes('id="root"></div>') && !content.includes('<div id="root"><div')) {
     console.log('Root appears empty.');
  } else {
     console.log('Root seems to have content:', content.slice(0, 300));
  }
  
  await browser.close();
})();
