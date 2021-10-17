import http from 'http';
import SocketIO from 'socket.io';
import express from 'express';

const app = express();

// Template engine
app.set('view engine', 'pug');
app.set('views', __dirname + '/views/');

// Static files are served at /public path
app.use('/public', express.static(__dirname + '/public'));

// Landing page
app.get('/', (_, res) => {
  res.render('home');
});

// Redirect other urls to home
app.get('/*', (_, res) => {
  res.redirect('/');
});

// Setup Server
const httpServer = http.createServer(app);
// eslint-disable-next-line new-cap
const socketIOServer = SocketIO(httpServer);

// Socket.IO
socketIOServer.on('connection', (socket) => {
  // room: Entering/creating the room
  socket.on('enter-room', (roomName, done) => {
    // Join the room
    socket.join(roomName);
    // Able to call a function on the front-end after server's operation finishes
    done(roomName);
  });
});

httpServer.listen(3000, () => {
  console.log('Listening on http://localhost:3000');
});
