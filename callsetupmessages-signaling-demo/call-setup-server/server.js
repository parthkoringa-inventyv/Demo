const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');

const server = https.createServer({
  key: fs.readFileSync('192.168.10.25+1-key.pem'),
  cert: fs.readFileSync('192.168.10.25+1.pem')
});


const wss = new WebSocket.Server({ noServer: true });

// Store connected users
// key: userId
// value: WebSocket connection
const clients = new Map();

/**
 * Upgrade HTTP → WebSocket
 */
server.on('upgrade', (request, socket, head) => {
  try {
    const url = new URL(request.url, `https://${request.headers.host}`);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      socket.destroy();
      return;
    }

    // Prevent duplicate user connections
    if (clients.has(userId)) {
      console.log(`Duplicate connection rejected for ${userId}`);
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      ws.userId = userId;
      clients.set(userId, ws);
      wss.emit('connection', ws);
    });

  } catch (err) {
    socket.destroy();
  }
});

/**
 * WebSocket connection handler
 */
wss.on('connection', (ws) => {
  console.log(`User connected: ${ws.userId}`);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (!message.to || !message.type) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid signaling message'
        }));
        return;
      }

      const target = clients.get(message.to);

      if (target && target.readyState === WebSocket.OPEN) {
        // Forward signaling message
        target.send(JSON.stringify({
          ...message,
          from: ws.userId
        }));
      } else {
        ws.send(JSON.stringify({
          type: 'error',
          message: `User ${message.to} is not connected`
        }));
      }

    } catch (err) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid JSON format'
      }));
    }
  });

  ws.on('close', () => {
    console.log(`User disconnected: ${ws.userId}`);
    clients.delete(ws.userId);
  });

  ws.on('error', () => {
    clients.delete(ws.userId);
  });
});

/**
 * Start server
 */
server.listen(8080, '0.0.0.0', () => {
  console.log('Signaling server running');
  console.log('Local: https://localhost:8080');
});
