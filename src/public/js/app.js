// HTML Elements
const roomJoinForm = document.querySelector('#welcome form');
const chatRoom = document.querySelector('#room');

// Global variable
let roomName; // chat room name

// At the beginning, the chatRoom is hidden (Not yet joined to the chat room)
chatRoom.hidden = true;

// Will use same doemain (window.location) address to establish connection
const socket = io();

/**
 * Helper method to add message to the chatList
 *
 * @param {string} msg message to add on the chatList
 */
function addMessage(msg) {
  const chatList = document.querySelector('#room ul');
  const li = document.createElement('li');
  li.innerText = msg;
  chatList.appendChild(li);
}

// EventListener for joining new room
roomJoinForm.addEventListener('submit', (submitEvent) => {
  submitEvent.preventDefault();

  // Create/Enter the room
  const roomJoinFormInput = roomJoinForm.querySelector('input');
  socket.emit('enter-room', roomJoinFormInput.value, (joinedRoomName) => {
    roomName = joinedRoomName; // Save the room name

    // Display
    roomJoinForm.hidden = true;
    chatRoom.hidden = false;
    chatRoom.querySelector('h3').innerText = `Room ${roomName}`;

    // EventListener for sending new message
    const chatForm = document.querySelector('#room form');
    chatForm.addEventListener('submit', (submitEvent) => {
      submitEvent.preventDefault();

      // Send new message
      const input = chatForm.querySelector('input');
      const value = input.value;
      socket.emit('new-message', value, roomName, () => {
        addMessage(`You: ${value}`);
      });
      input.value = '';
    });
  });
  roomJoinFormInput.value = '';
});

// Receive welcome message (Someone Joined room)
socket.on('welcome', () => {
  addMessage('someone joined');
});

// Received bye message (Someone left the room)
socket.on('bye', () => {
  addMessage('someone left');
});

// Received new message
socket.on('new-message', (msg) => {
  addMessage(msg);
});
