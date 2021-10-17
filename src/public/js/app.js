// HTML Elements
const roomJoinForm = document.querySelector('#welcome form');
const roomJoinFormInput = roomJoinForm.querySelector('input');
const chatRoom = document.querySelector('#room');

// Global variable
let roomName; // chat room name

// At the beginning, the chatRoom is hidden (Not yet joined to the chat room)
chatRoom.hidden = true;

// Will use same doemain (window.location) address to establish connection
const socket = io();

// Create/Enter the room
roomJoinForm.addEventListener('submit', (submitEvent) => {
  submitEvent.preventDefault();

  socket.emit('enter-room', roomJoinFormInput.value, (joinedRoomName) => {
    roomName = joinedRoomName; // Save the room name

    // Display
    roomJoinForm.hidden = true;
    chatRoom.hidden = false;
    chatRoom.querySelector('h3').innerText = `Room ${roomName}`;
  });
  roomJoinFormInput.value = '';
});
