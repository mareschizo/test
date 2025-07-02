const WebSocket = require('ws');
const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);

  // If the path is /ws, do nothing (WebSocket upgrade will handle it)
  if (parsedUrl.pathname === '/ws') {
    // Let the WebSocket server handle this
    return;
  }

  // Serve a simple HTML page for any other path
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Simple WebSocket Server</title>
      </head>
      <body>
        <h1>Welcome!</h1>
        <p>This is a simple HTML page served by the server.</p>
      </body>
    </html>
  `);
});

const wss = new WebSocket.Server({ server, path: '/ws' });

const rateLimits = {};

wss.on('connection', (ws, req) => {
  // Get the IP address (may need adjustment for proxies)
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket.remoteAddress;

  ws.on('message', (message) => {
    if (typeof message !== 'string' && !Buffer.isBuffer(message)) return;
    // Convert Buffer to string if needed
    if (Buffer.isBuffer(message)) message = message.toString();

    if (message.startsWith('b')) {
      const now = Date.now();
      if (!rateLimits[ip] || now - rateLimits[ip] > 1000) {
        rateLimits[ip] = now;
        ws.send('r' + message.slice(1)); // ack
        // TODO: Update Firebase here if needed
      } else {
        ws.send('R' + message.slice(1)); // nack (rate limited)
      }
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log('WebSocket server running on port', PORT);
});