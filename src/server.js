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
      socket.to(room).emit('bye', socket.nickname)
    );
  });

  // room: Entering/creating the room
  socket.on('enter-room', (roomName, done) => {
    socket.join(roomName); // Join the room
    // Able to call a function on the front-end after server's operation finishes
    done(roomName);
    // Notify everyone new member entered
    // Welcome mesage does not sent to the one just joined
    socket.to(roomName).emit('join', socket.nickname);
  });

  // room: Leaving the room
  socket.on('leave-room', (roomName, done) => {
    socket.leave(roomName); // Leave the room
    done(); // report client that user successfully left the room
    // Notify other users in the room that the user has left
    socketIOServer.in(roomName).emit('bye', socket.nickname);
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
    socket.to(roomName).emit('new-message', `${socket.nickname}: ${msg}`);
    done();
  });
});

httpServer.listen(3000, () => {
  console.log('Listening on http://localhost:3000');
});
