// server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// Set your target site here
const TARGET_SITE = 'https://example.com';

// Simple proxy route (all requests go here)
app.use('/', async (req, res, next) => {
  const usePuppeteer = true; // always use Puppeteer to bypass detection

  if (!usePuppeteer) {
    // Simple proxy fallback (fast)
    createProxyMiddleware({
      target: TARGET_SITE,
      changeOrigin: true,
      secure: true,
      logLevel: 'silent',
      onProxyReq: (proxyReq, req2, res2) => {
        proxyReq.setHeader('User-Agent', req.get('User-Agent') || 'Mozilla/5.0');
        proxyReq.setHeader('Cookie', req.get('Cookie') || '');
        proxyReq.setHeader('Accept', req.get('Accept') || '*/*');
        proxyReq.setHeader('Referer', req.get('Referer') || '');
      },
      pathRewrite: { '^/': '/' },
    })(req, res, next);
  } else {
    // Puppeteer rendering (bypasses proxy blocks)
    try {
      const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
      const page = await browser.newPage();

      await page.setUserAgent(req.get('User-Agent') || 'Mozilla/5.0');
      const cookies = req.get('Cookie');
      if (cookies) {
        const cookieArray = cookies.split(';').map(c => {
          const [name, ...rest] = c.split('=');
          return { name: name.trim(), value: rest.join('=').trim(), domain: new URL(TARGET_SITE).hostname };
        });
        await page.setCookie(...cookieArray);
      }

      await page.goto(TARGET_SITE, { waitUntil: 'networkidle2' });
      const content = await page.content();
      await browser.close();
      res.send(content);
    } catch (err) {
      res.status(500).send('Puppeteer error: ' + err.message);
    }
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
