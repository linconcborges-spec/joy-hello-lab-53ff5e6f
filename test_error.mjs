import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console', msg.type(), msg.text());
    }
  });
  
  page.on('pageerror', err => {
    console.log('PageError', err.message);
  });

  try {
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
  } catch (err) {}

  await new Promise(r => setTimeout(r, 1000));
  
  // bypass login? We probably have to click "Entrar" or bypass auth.
  // Wait, if ProductsPage is shown AFTER login, we must log in.
  // But wait! Can we just mount ProductsPage in isolation to see the error?
  // Let's modify App.tsx temporarily to just load ProductsPage at '/'!
  
  await browser.close();
})();
