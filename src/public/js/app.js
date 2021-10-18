// HTML Elements
const nicknameBox = document.querySelector('#nickname');
const nicknameForm = nicknameBox.querySelector('form');
const joinRoomBox = document.querySelector('#join-room');
const joinRoomForm = joinRoomBox.querySelector('#enter-room');
const joinRoomChangeNickname = joinRoomBox.querySelector('#change-nickname');
const chatRoomBox = document.querySelector('#chatroom');
const chatRoomForm = chatRoomBox.querySelector('#message');
const chatRoomExit = chatRoomBox.querySelector('#exit');

// Global variable
let currentRoomName; // chat room name
let currentPublicRooms; // place to store current public room list
let intervalDisplayPublicRooms; // interval to call displayPublicRoom() every 3 seconds.

// Display: At the beginning, show the nickname box
nicknameBox.hidden = false;
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
    // Display: Show joinRoomBox
    nicknameBox.hidden = true;
    joinRoomBox.hidden = false;
    chatRoomBox.hidden = true;
    document.querySelector('body header h4').innerText = `Hello ${nickname}`;
  });

  // Show the opened room list
  displayPublicRooms(); // at t = 0
  intervalDisplayPublicRooms = setInterval(displayPublicRooms, 3000); // at t = 3n
});

// EventListener for joining new room
joinRoomForm.addEventListener('submit', (submitEvent) => {
  submitEvent.preventDefault();
  // no need to get public rooms list more
  clearInterval(intervalDisplayPublicRooms);

  // Create/Enter the room
  const joinRoomFormInput = joinRoomForm.querySelector('input');
  socket.emit(
    'enter-room',
    joinRoomFormInput.value,
    (joinedRoomName, userCount) => {
      currentRoomName = joinedRoomName; // Save the room name
      currentUserCount = userCount;

      // Display: Show the chatRoomBox
      nicknameBox.hidden = true;
      joinRoomBox.hidden = true;
      chatRoomBox.hidden = false;
      chatRoomBox.querySelector(
        'h3'
      ).innerText = `Room: ${currentRoomName} (${userCount})`;
    }
  );
  joinRoomFormInput.value = '';
});

// EventListener for changing username (go to the main screen)
joinRoomChangeNickname.addEventListener('submit', (submitEvent) => {
  submitEvent.preventDefault();

  // Go back to main screen
  nicknameBox.hidden = false;
  joinRoomBox.hidden = true;
  chatRoomBox.hidden = true;
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

// EventListener for exit a chat room
chatRoomExit.addEventListener('submit', (submitEvent) => {
  submitEvent.preventDefault();

  // Leave from the room
  socket.emit('leave-room', currentRoomName, () => {
    // Left room
    currentRoomName = '';
    chatRoomBox.querySelector('h3').innerText = '';
    chatRoomBox.querySelector('ul').innerHTML = '';

    // Display: Back to joinRoomBox
    nicknameBox.hidden = true;
    joinRoomBox.hidden = false;
    chatRoomBox.hidden = true;
  });

  // Show the opened room list
  displayPublicRooms(); // at t = 0
  intervalDisplayPublicRooms = setInterval(displayPublicRooms, 3000); // at t = 3n
});

// Receive welcome message (Someone Joined room)
socket.on('join', (user, userCount) => {
  addMessage(`${user} joined`);
  chatRoomBox.querySelector(
    'h3'
  ).innerText = `Room: ${currentRoomName} (${userCount})`;
});

// Received bye message (Someone left the room)
socket.on('bye', (user, userCount) => {
  addMessage(`${user} left`);
  chatRoomBox.querySelector(
    'h3'
  ).innerText = `Room: ${currentRoomName} (${userCount})`;
});

// Received new message
socket.on('new-message', (msg) => {
  addMessage(msg);
});
