// HTML Elements
const nicknameBox = document.querySelector('#nickname');
const nicknameForm = nicknameBox.querySelector('form');
const joinRoomBox = document.querySelector('#join-room');
const joinRoomForm = joinRoomBox.querySelector('form');
const chatRoomBox = document.querySelector('#chatroom');
const chatRoomForm = chatRoomBox.querySelector('form');

// Global variable
let currentRoomName; // chat room name
let currentPublicRooms; // place to store current public room list
let intervalDisplayPublicRooms; // interval to call displayPublicRoom() every 3 seconds.

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

/**
 * Helper method to display the list of public rooms
 */
function displayPublicRooms() {
  socket.emit('list-rooms', (publicRooms) => {
    if (JSON.stringify(currentPublicRooms) === JSON.stringify(publicRooms)) {
      // Check for room list updates
      return;
    } else {
      // When room list updated
      currentPublicRooms = publicRooms;

      // Empty the displayed list
      const joinRoomList = joinRoomBox.querySelector('#opened-room-list ul');
      joinRoomList.innerHTML = '';

      // Display the room list
      publicRooms.forEach((publicRoom) => {
        const li = document.createElement('li');
        li.innerText = publicRoom;
        joinRoomList.appendChild(li);
      });
    }
  });
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
  displayPublicRooms(); // at t = 0
  intervalDisplayPublicRooms = setInterval(displayPublicRooms, 3000); // at t = 3n
});

// EventListener for joining new room
joinRoomForm.addEventListener('submit', (submitEvent) => {
  submitEvent.preventDefault();
  clearInterval(intervalDisplayPublicRooms); // no need to get public rooms list more

  // Create/Enter the room
  const joinRoomFormInput = joinRoomForm.querySelector('input');
  socket.emit('enter-room', joinRoomFormInput.value, (joinedRoomName) => {
    currentRoomName = joinedRoomName; // Save the room name

    // Display
    joinRoomBox.hidden = true;
    chatRoomBox.hidden = false;
    chatRoomBox.querySelector('h3').innerText = `Room: ${currentRoomName}`;
  });
  joinRoomFormInput.value = '';
});

// EventListener for sending new message
chatRoomForm.addEventListener('submit', (submitEvent) => {
  submitEvent.preventDefault();

  // Send new message
  const input = chatRoomForm.querySelector('input');
  const value = input.value;
  socket.emit('new-message', value, currentRoomName, () => {
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
