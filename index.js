const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

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
