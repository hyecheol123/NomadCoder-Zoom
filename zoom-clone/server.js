import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import express from 'express';

const app = express();

// Template engine
app.set('view engine', 'pug');
app.set('views', __dirname + '/views/');

// Static files are served at /public path & ../admin-panel path
app.use('/public', express.static(path.join(__dirname, '/public')));

// Landing page
app.get('/', (_, res) => {
  res.render('home');
});

// Redirect other urls to home
app.use((_, res) => {
  res.redirect('/');
});

// Setup Server
const httpServer = http.createServer(app);
// eslint-disable-next-line new-cap
const socketIOServer = new Server(httpServer);

socketIOServer.on('connection', (socket) => {
  socket.on('join-room', (roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit('welcome');
  });

  socket.on('offer', (roomName, webRTCOffer) => {
    socket.to(roomName).emit('offer', webRTCOffer);
  });

  socket.on('answer', (roomName, webRTCAnswer) => {
    socket.to(roomName).emit('answer', webRTCAnswer);
  });
});

httpServer.listen(3001, () => {
  console.log('Listening on http://localhost:3001');
});
