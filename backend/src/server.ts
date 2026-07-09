import http from 'http';
import app from './app';
import env from './config/env';
import { createSocketServer } from './websocket/socket.server';

const server = http.createServer(app);

// Attach Socket.IO
createSocketServer(server);

server.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});

export default server;
