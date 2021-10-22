import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import { instrument } from '@socket.io/admin-ui';
import express from 'express';

const app = express();

// Template engine
app.set('view engine', 'pug');
app.set('views', __dirname + '/views/');

// Static files are served at /public path & ../admin-panel path
app.use('/public', express.static(path.join(__dirname, '/public')));
app.use('/admin-panel', express.static(path.join(__dirname, '../admin-panel')));

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
// Setup Admin Panel
instrument(socketIOServer, {
  auth: false,
});

/**
 * Helper method to count user in the room
 *
 * @param {string} roomName name of room
 * @return {number} number indicates how many souls in the room
 */
function countUserInRoom(roomName) {
  // Query the size of room
  const userCnt = socketIOServer.sockets.adapter.rooms.get(roomName)?.size;
  if (userCnt === undefined) {
    return 0; // Error & No one in the room
  } else {
    return userCnt;
  }
}

// Socket.IO
socketIOServer.on('connection', (socket) => {
  socket['nickname'] = 'anonymous';

  // user: Nickname
  socket.on('nickname', (nickname, done) => {
    socket['nickname'] = nickname;
    done(nickname);
  });

  // user: disconnecting
  socket.on('disconnecting', () => {
    // Notify everyone on the chat room the user participating
    socket.rooms.forEach((room) =>
      socket
        .to(room)
        // User not left, s/he is still in the room (leaving the room)
        .emit('bye', socket.nickname, countUserInRoom(room) - 1)
    );
  });

  // room: Entering/creating the room
  socket.on('enter-room', (roomName, done) => {
    socket.join(roomName); // Join the room
    // Able to call a function on the front-end after server's operation finishes
    done(roomName, countUserInRoom(roomName)); // User already in the room
    // Notify everyone new member entered
    // Welcome mesage does not sent to the one just joined
    socket
      .to(roomName)
      // Also notifying how many souls on board
      .emit('join', socket.nickname, countUserInRoom(roomName));
  });

  // room: Leaving the room
  socket.on('leave-room', (roomName, done) => {
    socket.leave(roomName); // Leave the room
    done(); // report client that user successfully left the room
    // Notify other users in the room that the user has left
    socketIOServer
      .in(roomName)
      // User already left the room
      .emit('bye', socket.nickname, countUserInRoom(roomName));
  });

  // room: List existing rooms
  socket.on('list-rooms', (done) => {
    // Variables
    const sids = socketIOServer.sockets.adapter.sids; // socketIDs
    const rooms = socketIOServer.sockets.adapter.rooms; // Rooms
    const publicRooms = []; // list of public rooms

    // Iterate through the room list to retrieve public room list
    rooms.forEach((_, key) => {
      // The private room's name is equal to the socketID
      if (sids.get(key) === undefined) {
        publicRooms.push(key);
      }
    });

    // Send client list of rooms
    done(publicRooms);
  });

  // Chat: New Message
  socket.on('new-message', (msg, roomName, done) => {
    // Send the message to the chat room members
    // Send sender, message, and timestamp
    socket.to(roomName).emit('new-message', socket.nickname, msg, new Date());
    done();
  });
});

httpServer.listen(3000, () => {
  console.log('Listening on http://localhost:3000');
});
