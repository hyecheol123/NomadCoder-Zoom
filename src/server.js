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
    socket.join(roomName); // Join the room
    // Able to call a function on the front-end after server's operation finishes
    done(roomName);
    // Notify everyone new member entered
    // Welcome mesage does not sent to the one just joined
    socket.to(roomName).emit('welcome');
  });

  // room: Left the room
  socket.on('disconnecting', () => {
    // Notify everyone on the chat room the user participating
    socket.rooms.forEach((room) => socket.to(room).emit('bye'));
  });

  // Chat: New Message
  socket.on('new-message', (msg, roomName, done) => {
    // Send the message to the chat room members
    socket.to(roomName).emit('new-message', msg);
    done();
  });
});

httpServer.listen(3000, () => {
  console.log('Listening on http://localhost:3000');
});
