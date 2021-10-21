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
const socket = io();

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
    chatForm.querySelector('input').value = '';

    // Show join-room view
    displayJoinRoomView();
  });
});
// Logout button (reset nickname)
headerLogoutBtn.addEventListener('click', () => {
  // Leave currently joined chatroom
  currentRoomName = '';
  chatroomTitle.innerText = '';
  chatList.innerHTML = '';

  // Clear nickname
  nicknameForm.querySelector('input').value = '';

  // show login view
  displayLoginView();
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

// Show login view at the beginning
displayLoginView();

// /**
//  * Helper method to add message to the chatList
//  *
//  * @param {string} msg message to add on the chatList
//  */
// function addMessage(msg) {
//   const chatList = chatRoomBox.querySelector('ul');
//   const li = document.createElement('li');
//   li.innerText = msg;
//   chatList.appendChild(li);
// }

// // EventListener for joining new room
// joinRoomForm.addEventListener('submit', (submitEvent) => {
//   submitEvent.preventDefault();
//   // no need to get public rooms list more
//   clearInterval(intervalDisplayPublicRooms);

//   // Create/Enter the room
//   const joinRoomFormInput = joinRoomForm.querySelector('input');
//   socket.emit(
//     'enter-room',
//     joinRoomFormInput.value,
//     (joinedRoomName, userCount) => {
//       currentRoomName = joinedRoomName; // Save the room name
//       currentUserCount = userCount;

//       // Display: Show the chatRoomBox
//       nicknameBox.hidden = true;
//       joinRoomBox.hidden = true;
//       chatRoomBox.hidden = false;
//       chatRoomBox.querySelector(
//         'h3'
//       ).innerText = `Room: ${currentRoomName} (${userCount})`;
//     }
//   );
//   joinRoomFormInput.value = '';
// });

// // EventListener for sending new message
// chatRoomForm.addEventListener('submit', (submitEvent) => {
//   submitEvent.preventDefault();

//   // Send new message
//   const input = chatRoomForm.querySelector('input');
//   const value = input.value;
//   socket.emit('new-message', value, currentRoomName, () => {
//     addMessage(`You: ${value}`);
//   });
//   input.value = '';
// });

// // Receive welcome message (Someone Joined room)
// socket.on('join', (user, userCount) => {
//   addMessage(`${user} joined`);
//   chatRoomBox.querySelector(
//     'h3'
//   ).innerText = `Room: ${currentRoomName} (${userCount})`;
// });

// // Received bye message (Someone left the room)
// socket.on('bye', (user, userCount) => {
//   addMessage(`${user} left`);
//   chatRoomBox.querySelector(
//     'h3'
//   ).innerText = `Room: ${currentRoomName} (${userCount})`;
// });

// // Received new message
// socket.on('new-message', (msg) => {
//   addMessage(msg);
// });
