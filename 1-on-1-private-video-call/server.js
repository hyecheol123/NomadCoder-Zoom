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
  // join-room: When an user start/join a room
  // nickname: user's nickname
  // roomName: name of the room which user want to join
  // Reply:
  //  - 'join-room': send nickname and uniqueID of the user to other peer
  //    to get approval
  //    User not yet joined to the room
  // done callback is used to notify how the request
  //   has been processed to requester
  //   - 'created-room': indicating that new room has been created
  //   - 'wait-approval': indicating that the request to join the room is
  //       under review by the room owner
  //   - 'exceed-max-capacity': When the room exceed maximum capacity of
  //       allowable clients (maximum 2 peers are available)
  socket.on('join-room', (nickname, roomName, done) => {
    // Check the existence of room and how many people are in there
    const userCount = socketIOServer.sockets.adapter.rooms.get(roomName)?.size;

    if (userCount === undefined || userCount === 0) {
      // If room does not exists, user started a new room
      socket.join(roomName);
      // Set nickname of the user
      socket['nickname'] = nickname;
      // Notify that the room has been created
      done('created-room');
    } else if (userCount === 1) {
      // When room exists and only have one user in the room
      // (not yet exceed the capacity), ask the room owner to accept the user
      socketIOServer.in(roomName).emit('join-room', nickname, socket.id);
      // Notify that the request is currently under review
      done('wait-approval');
    } else {
      // Notify that the capacity of room exceed
      done('exceed-max-capacity');
    }
  });

  socket.on('offer', (roomName, webRTCOffer) => {
    socket.to(roomName).emit('offer', webRTCOffer);
  });

  socket.on('answer', (roomName, webRTCAnswer) => {
    socket.to(roomName).emit('answer', webRTCAnswer);
  });

  socket.on('ice-candidate', (roomName, iceCandidate) => {
    socket.to(roomName).emit('ice-candidate', iceCandidate);
  });
});

httpServer.listen(3001, () => {
  console.log('Listening on http://localhost:3001');
});
