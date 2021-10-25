// HTML Elements
const headerExitRoomBtn = document.querySelector('#toolbox #exit-room');
const headerLogoutBtn = document.querySelector('#toolbox #logout');
const loginView = document.querySelector('#login');
const nicknameForm = loginView.querySelector('.input form');
const joinRoomView = document.querySelector('#join-room');
const openedRoomOption = joinRoomView.querySelector('#opened-room-list select');
const joinRoomForm = joinRoomView.querySelector('.input form');
const chatroomView = document.querySelector('#chatroom');
const chatroomTitle = chatroomView.querySelector('#room-name');
const chatList = chatroomView.querySelector('#chat-list ul');
const chatForm = chatroomView.querySelector('.input form');

// Global variable
let currentRoomName; // chat room name
let currentPublicRooms = []; // place to store current public room list
let intervalUpdatePublicRoomList; // interval to call displayPublicRoom() every 3 seconds.
let userNickname; // nickname of user

// Will use same doemain (window.location) address to establish connection
const socket = io.connect(window.location.host, {
  path: `${window.location.pathname}socket.io`,
});

/**
 * Helper method to display the list of public rooms
 */
function updatePublicRoomList() {
  socket.emit('list-rooms', (publicRooms) => {
    // Check for room list updates
    if (JSON.stringify(currentPublicRooms) === JSON.stringify(publicRooms)) {
      return;
    } else {
      // Room list updated
      currentPublicRooms = publicRooms;

      // Empty displayed selection
      openedRoomOption.innerHTML = '';

      // Display the room list
      publicRooms.forEach((roomName) => {
        const option = document.createElement('option');
        option.value = roomName;
        option.innerText = roomName;
        openedRoomOption.appendChild(option);
      });

      // Check for previously selected value
      const selected = joinRoomForm.querySelector('input').value;
      for (let index = 0; index < openedRoomOption.options.length; index++) {
        const currValue = openedRoomOption.options[index].value;

        if (selected === currValue) {
          openedRoomOption.selectedIndex = index;
          break;
        }
      }
    }
  });
}

/**
 * Helper method to add message to the chatList
 *
 * @param {string} sender sender of message
 * @param {string} msg message content
 * @param {string} timestampString Date object indicates when message received
 */
function addMessage(sender, msg, timestampString) {
  // div.chat-content
  const chatContent = document.createElement('div');
  chatContent.classList.add('chat-content');
  // Sender
  const chatUser = document.createElement('span');
  chatUser.classList.add('chat-user');
  chatUser.innerText = `${sender}:`;
  chatContent.appendChild(chatUser);
  // Message
  const chatText = document.createElement('span');
  chatText.classList.add('chat-text');
  chatText.innerText = msg;
  chatContent.appendChild(chatText);

  // div.chat-timestamp
  const chatTimestamp = document.createElement('div');
  chatTimestamp.classList.add('chat-timestamp');
  // Timestamp
  const chatTimestampSpan = document.createElement('span');
  const timestamp = new Date(timestampString);
  const dateString = timestamp.toLocaleDateString();
  const timeString = timestamp.toTimeString().split(' ')[0].substring(0, 5);
  chatTimestampSpan.innerText = `${dateString} ${timeString}`;
  chatTimestamp.appendChild(chatTimestampSpan);

  // li.chat
  const li = document.createElement('li');
  li.classList.add('chat');
  li.appendChild(chatContent);
  li.appendChild(chatTimestamp);

  // Add to chatList
  chatList.appendChild(li);

  // Scroll to bottom
  chatList.scrollTop = chatList.scrollHeight;
}

/**
 * Helper method to add admin message to the chatList (leave/join chatroom)
 *
 * @param {string} msg admin message
 */
function addAdminMessage(msg) {
  // li.admin-message
  const li = document.createElement('li');
  li.classList.add('admin-message');
  const span = document.createElement('span');
  span.innerText = msg;
  li.appendChild(span);

  // Add to chatList
  chatList.appendChild(li);

  // Scroll to bottom
  chatList.scrollTop = chatList.scrollHeight;
}

/**
 * Dispaly login view
 */
function displayLoginView() {
  // Stop timer displaying public room list
  if (intervalUpdatePublicRoomList !== undefined) {
    clearInterval(intervalUpdatePublicRoomList);
  }

  loginView.style.display = 'flex';
  joinRoomView.style.display = 'none';
  chatroomView.style.display = 'none';
  // on login view, nothing to show on header
  headerExitRoomBtn.style.visibility = 'hidden';
  headerLogoutBtn.style.visibility = 'hidden';
}

/**
 * Display join-room view
 */
function displayJoinRoomView() {
  loginView.style.display = 'none';
  joinRoomView.style.display = 'flex';
  chatroomView.style.display = 'none';
  // on join-room view, only show logout button on header
  headerExitRoomBtn.style.visibility = 'hidden';
  headerLogoutBtn.style.visibility = 'visible';

  // Start timer to display public room list
  updatePublicRoomList(); // at t = 0
  intervalUpdatePublicRoomList = setInterval(updatePublicRoomList, 3000); // at t = 3n
}

/**
 * Dispaly chatroom view
 */
function displayChatroomView() {
  // Stop timer displaying public room list
  if (intervalUpdatePublicRoomList !== undefined) {
    clearInterval(intervalUpdatePublicRoomList);
  }

  loginView.style.display = 'none';
  joinRoomView.style.display = 'none';
  chatroomView.style.display = 'flex';
  // on chatroom view, show buth buttons on header
  headerExitRoomBtn.style.visibility = 'visible';
  headerLogoutBtn.style.visibility = 'visible';
}

/**
 * Logout from current session
 */
function logoutHelper() {
  currentRoomName = '';
  chatroomTitle.innerText = '';
  chatList.innerHTML = '';

  // Clear previously entered message
  chatForm.querySelector('textarea').value = '';

  // Clear room selection
  joinRoomForm.querySelector('input').value = '';

  // Clear nickname
  nicknameForm.querySelector('input').value = '';

  // show login view
  displayLoginView();
}

// Header button's EventListener
// Exit room button
headerExitRoomBtn.addEventListener('click', () => {
  // Leave from the room
  socket.emit('leave-room', currentRoomName, () => {
    // Left room
    currentRoomName = '';
    chatroomTitle.innerText = '';
    chatList.innerHTML = '';

    // Clear previously entered message
    chatForm.querySelector('textarea').value = '';

    // Show join-room view
    displayJoinRoomView();
  });
});
// Logout button (reset nickname)
headerLogoutBtn.addEventListener('click', () => {
  // Leave currently joined chatroom
  socket.emit('leave-room', currentRoomName, () => {
    logoutHelper();
  });
});

// EventListener: Login View - nicknameForm
nicknameForm.addEventListener('submit', (submitEvent) => {
  submitEvent.preventDefault();

  // set nickname
  const nickname = nicknameForm.querySelector('input').value;
  socket.emit('nickname', nickname, (setNickname) => {
    userNickname = setNickname;

    // Display join-room view
    displayJoinRoomView();
  });
});

// EventListener: Join Room View - Opened Room Option
openedRoomOption.addEventListener('change', (changeEvent) => {
  // Write value of selected option to join room form
  joinRoomForm.querySelector('input').value = openedRoomOption.value;
});
// EventListener: Join Room View - joinRoomForm
joinRoomForm.addEventListener('submit', (submitEvent) => {
  submitEvent.preventDefault();

  // Create/Enter the room
  const input = joinRoomForm.querySelector('input').value;
  socket.emit('enter-room', input, (joinedRoomName, userCount) => {
    currentRoomName = joinedRoomName; // save the room name

    // Display chatroom view
    chatroomTitle.innerText = `Room: ${currentRoomName} (${userCount})`;
    displayChatroomView();
  });
});

// EventListener to send form when enter pressed in the textarea
chatForm.querySelector('textarea').addEventListener('keydown', (event) => {
  if (event.keyCode === 13) {
    event.preventDefault();
    chatForm.querySelector('button').click();
  }
});

// EventListener for sending new message
chatForm.addEventListener('submit', (submitEvent) => {
  submitEvent.preventDefault();

  // Send new message
  const input = chatForm.querySelector('textarea');
  const value = input.value;
  socket.emit('new-message', value, currentRoomName, () => {
    addMessage(`${userNickname} (you)`, value, new Date().toISOString());
  });
  input.value = '';
});

// SocketIO: Receive welcome message (Someone Joined room)
socket.on('join', (user, userCount) => {
  // Notify user join
  addAdminMessage(`${user} joined`);

  // Change room title to indicate the correct user count
  chatroomTitle.innerText = `Room: ${currentRoomName} (${userCount})`;
});

// SocketIO: Received bye message (Someone left the room)
socket.on('bye', (user, userCount) => {
  // Notify user left
  addAdminMessage(`${user} left`);

  // Change chatroom title to indicate the correct user count
  chatroomTitle.innerText = `Room: ${currentRoomName} (${userCount})`;
});

// SocketIO: Received new message
socket.on('new-message', (sender, msg, timestamp) => {
  addMessage(sender, msg, timestamp);
});

// SocketIO: When disconnected, return to login page
socket.on('disconnect', () => {
  logoutHelper();
});

// Show login view at the beginning
displayLoginView();
