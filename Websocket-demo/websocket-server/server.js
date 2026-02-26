const http = require('http');
const WebSocket = require('ws');
const url = require('url');

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('WebSocket Chat Server Running');
});

// Create WebSocket server (noServer because we handle upgrade manually)
const wss = new WebSocket.Server({ noServer: true });

// Store active users
const clients = new Map();
// key: userId
// value: WebSocket instance

// Handle upgrade manually
server.on('upgrade', (request, socket, head) => {
  const fullUrl = new URL(request.url, `http://${request.headers.host}`);
  const userId = fullUrl.searchParams.get('userId');

  if (!userId) {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    ws.userId = userId;
    clients.set(userId, ws);
    wss.emit('connection', ws);
  });
});

// WebSocket connection
wss.on('connection', (ws) => {
  console.log(`User connected: ${ws.userId}`);

  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      const { type, to, message } = parsed;

      if (!to) {
        ws.send(JSON.stringify({ error: 'Missing target user (to)' }));
        return;
      }

      const target = clients.get(to);

      if (!target || target.readyState !== WebSocket.OPEN) {
        ws.send(JSON.stringify({
          error: `User ${to} is not connected`
        }));
        return;
      }

      if (type === 'typing' || type === 'stop_typing') {
        target.send(JSON.stringify({
          type,
          from: ws.userId
        }));
        return;
      }

      if (message) {
        target.send(JSON.stringify({
          type: 'chat',
          from: ws.userId,
          message
        }));
        return;
      }

      ws.send(JSON.stringify({ error: 'Invalid message format' }));

    } catch (err) {
      ws.send(JSON.stringify({ error: 'Invalid JSON' }));
    }
  });

  ws.on('close', () => {
    console.log(`User disconnected: ${ws.userId}`);
    clients.delete(ws.userId);
  });
});

// Bind to all network interfaces (LAN accessible)
server.listen(8080, '0.0.0.0', () => {
  console.log('Server running on:');
  console.log('Local:   http://localhost:8080');
  console.log('LAN:     http://192.168.10.25:8080');
});
