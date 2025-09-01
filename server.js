const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;

// Proxy all requests to example.com
app.use('/', createProxyMiddleware({
  target: 'https://doctoraux.com',   // target site
  changeOrigin: true,              // rewrite Host header
  secure: true,                    // verify SSL certificates
  pathRewrite: {'^/':'/'},         // rewrite URL path if needed
  onProxyReq: (proxyReq, req, res) => {
    // Forward client User-Agent
    proxyReq.setHeader('User-Agent', req.get('User-Agent'));
  }
}));

app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
