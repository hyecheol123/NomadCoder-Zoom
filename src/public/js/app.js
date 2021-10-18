// HTML Elements
const nicknameBox = document.querySelector('#nickname');
const nicknameForm = nicknameBox.querySelector('form');
const joinRoomBox = document.querySelector('#join-room');
const joinRoomForm = joinRoomBox.querySelector('form');
const chatRoomBox = document.querySelector('#chatroom');
const chatRoomForm = chatRoomBox.querySelector('form');

// Global variable
let roomName; // chat room name

// Display
joinRoomBox.hidden = true;
chatRoomBox.hidden = true;

// Will use same doemain (window.location) address to establish connection
const socket = io();

/**
 * Helper method to add message to the chatList
 *
 * @param {string} msg message to add on the chatList
 */
function addMessage(msg) {
  const chatList = chatRoomBox.querySelector('ul');
  const li = document.createElement('li');
  li.innerText = msg;
  chatList.appendChild(li);
}

// EventListener for setting nickname
nicknameForm.addEventListener('submit', (submitEvent) => {
  submitEvent.preventDefault();

  // Set nickname
  const input = nicknameForm.querySelector('input');
  socket.emit('nickname', input.value, (nickname) => {
    // Display
    nicknameBox.hidden = true;
    joinRoomBox.hidden = false;
    document.querySelector('body header h4').innerText = `Hello ${nickname}`;
  });
  input.value = '';

  // Show the opened room list
  socket.emit('list-rooms', (publicRooms) => {
    // Display the room list
    const joinRoomList = joinRoomBox.querySelector('#opened-room-list ul');
    publicRooms.forEach((roomName) => {
      const li = document.createElement('li');
      li.innerText = roomName;
      joinRoomList.appendChild(li);
    });
  });
});

// EventListener for joining new room
joinRoomForm.addEventListener('submit', (submitEvent) => {
  submitEvent.preventDefault();

  // Create/Enter the room
  const joinRoomFormInput = joinRoomForm.querySelector('input');
  socket.emit('enter-room', joinRoomFormInput.value, (joinedRoomName) => {
    roomName = joinedRoomName; // Save the room name

    // Display
    joinRoomBox.hidden = true;
    chatRoomBox.hidden = false;
    chatRoomBox.querySelector('h3').innerText = `Room: ${roomName}`;
  });
  joinRoomFormInput.value = '';
});

// EventListener for sending new message
chatRoomForm.addEventListener('submit', (submitEvent) => {
  submitEvent.preventDefault();

  // Send new message
  const input = chatRoomForm.querySelector('input');
  const value = input.value;
  socket.emit('new-message', value, roomName, () => {
    addMessage(`You: ${value}`);
  });
  input.value = '';
});

// Receive welcome message (Someone Joined room)
socket.on('join', (user) => {
  addMessage(`${user} joined`);
});

// Received bye message (Someone left the room)
socket.on('bye', (user) => {
  addMessage(`${user} left`);
});

// Received new message
socket.on('new-message', (msg) => {
  addMessage(msg);
});
