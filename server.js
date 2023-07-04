const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);
const WebSocket = require('ws');

// WebSocket endpoint to receive data from Java program
app.ws('/data', (ws, req) => {
  // Listen for messages from the WebSocket client
  ws.on('message', (message) => {
    // Broadcast the received message to all connected WebSocket clients
    expressWs.getWss().clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

// Start the server
const port = 8080; // Change to your desired port
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
