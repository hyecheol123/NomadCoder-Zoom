// Frequently used HTML Element
const welcomeView = document.getElementById('welcome');
const welcomeForm = welcomeView.querySelector('form');
const welcomeAlert = welcomeView.querySelector('#alert');
const welcomeAlertMsg = welcomeAlert.querySelector('span');
const callView = document.getElementById('call');
const callContent = callView.querySelector('#call-content');
const myVideo = callContent.querySelector('#myStream #myVideo');
const peerVideo = callContent.querySelector('#peerVideo');
const muteBtn = callContent.querySelector('#control button#mute');
const cameraSelect = callContent.querySelector('#control #camera-selection');
const cameraBtn = callContent.querySelector('#control button#camera');
const hangUpBtn = callContent.querySelector('#control button#hang-up');
const modalWrapper = callView.querySelector('#modal-overlay');

// Constant: List of STUN Servers
const STUN_SERVER_LIST = [
  'stun:stun1.l.google.com:19302',
  'stun:stun2.l.google.com:19302',
  'stun:stun3.l.google.com:19302',
  'stun:stun4.l.google.com:19302',
  'stun:stun.nextcloud.com:443',
];

// Global variables
let myStream;
let myPeerConnection;
let myDataChannel;
let roomName;
let myNickname;
let peerNickname;
let muted = false;
let cameraOff = false;
// Contain information for the joining room request
const waitApprovalObj = {
  interval: null,
  counter: 0,
};

// Will use same domain (window.location) address to establish connection
let socket = io.connect(window.location.host, {
  path: `${window.location.pathname}socket.io`,
});

/**
 * Display Main/Welcome view
 */
function displayMain() {
  // Reset Main view
  // Clear Interval
  clearInterval(waitApprovalObj.interval);
  // Enable form
  const formElements = welcomeForm.elements;
  for (let index = 0; index < formElements.length; index++) {
    formElements[index].disabled = false;
  }
  // Hide Message
  welcomeAlertMsg.innerText = '';
  welcomeAlert.style.display = 'none';

  welcomeView.style.display = 'flex';
  callView.style.display = 'none';
}

/**
 * Display Call view
 */
function displayCall() {
  welcomeView.style.display = 'none';
  callView.style.display = 'flex';
}

/**
 * Start Camera
 *  - Generate new stream
 */
async function camStart() {
  // When current stream exists, stop the tracks
  if (myStream) {
    myStream.getTracks().forEach((track) => {
      // Clearly indicates that the stream no longer uses the source
      track.stop();
    });
  }

  // Create new video stream
  const videoSource = cameraSelect.value;
  const constraints = {
    audio: true,
    video: { deviceId: videoSource ? { exact: videoSource } : undefined },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(constraints);
    // Display video from the selected camera
    myVideo.srcObject = myStream;

    // Build/Update list of cameras
    cameraSelect.innerHTML = '';
    const devicesInfo = await navigator.mediaDevices.enumerateDevices();
    const cameraDevices = devicesInfo.filter(
      (device) => device.kind === 'videoinput'
    );
    const currentCamera = myStream.getVideoTracks()[0].label;
    cameraDevices.forEach((camera) => {
      const option = document.createElement('option');
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera === camera.label) {
        option.selected = true;
      }
      cameraSelect.appendChild(option);
    });
  } catch (e) {
    console.error(e);
  }
}

/**
 * Creating new RTCPeerConnection
 */
function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [{ urls: STUN_SERVER_LIST }],
  });

  // EventListner (myPeerConnection):
  //   iceCandidateEvent --> Receive iceCandidateEvent
  // The iceCandiate information needs to be transferred to the remote peer
  myPeerConnection.addEventListener('icecandidate', (iceCandidateEvent) => {
    socket.emit('ice-candidate', roomName, iceCandidateEvent.candidate);
  });

  // // EventListener (myPeerConnection):
  // //   addStream --> RTCPeerConnection get new MediaStream object
  // // Display the new media stream as the peer's video
  // // This event has been depreciated
  // myPeerConnection.addEventListener('addstream', (addstreamEvent) => {
  //   peerVideo.srcObject = addstreamEvent.stream;
  // });

  // EventListener (myPeerConnection):
  //   trackEvent --> RTCPeerConnection get new Track
  // Display new video track as the peer's video
  myPeerConnection.addEventListener('track', (trackEvent) => {
    peerVideo.srcObject = trackEvent.streams[0];
  });

  // Add current media stream to the RTCPeerConnection
  //   to send the stream to peer
  myStream.getTracks().forEach((track) => {
    myPeerConnection.addTrack(track, myStream);
  });
}

/**
 * Helper function to leave a call
 */
function hangUp() {
  // Disconnect peer connection (WebRTC)
  myPeerConnection.close();
  myPeerConnection = null;
  myDataChannel = null;
  myNickname = '';
  peerNickname = '';

  // Stop Video
  myStream.getTracks().forEach((track) => {
    // Clearly indicates that the stream no longer uses the source
    track.stop();
  });
  peerVideo.srcObject = null;

  // Leave room and notify to the peer
  socket.emit('leave-room', roomName, () => {
    roomName = '';
    displayMain();
  });
}

// EventListener (WelcomeForm): Process user's request to join the room
welcomeForm.addEventListener('submit', async (submitEvent) => {
  submitEvent.preventDefault();

  // Hide alerts
  welcomeAlert.style.display = 'none';

  // User Inputs
  myNickname = welcomeForm.querySelector('#nickname').value;
  roomName = welcomeForm.querySelector('#room-name').value;

  // Signaling Server
  socket.emit('join-room', myNickname, roomName, async (status) => {
    switch (status) {
      case 'created-room':
        // Init call
        await camStart();
        makeConnection(); // create webRTC Connection
        // Display
        displayCall();
        break;
      case 'wait-approval':
        // disable form
        const formElements = welcomeForm.elements;
        for (let index = 0; index < formElements.length; index++) {
          formElements[index].disabled = true;
        }

        // display message (Count 30 second)
        welcomeAlert.style.display = 'block';
        waitApprovalObj.counter = 30;
        waitApprovalObj.interval = setInterval(() => {
          // Display Message
          welcomeAlertMsg.innerText = `Waiting for Approval (${waitApprovalObj.counter})`;

          if (waitApprovalObj.counter !== 0) {
            // Reduce counter by 1
            --waitApprovalObj.counter;
          } else {
            // Timeout (30 second passed)
            clearInterval(waitApprovalObj.interval);

            // Generate new socketIO socket (disconnect from previous)
            socket.disconnect();
            socket = io.connect(window.location.host, {
              path: `${window.location.pathname}socket.io`,
            });
            // Enable form
            for (let index = 0; index < formElements.length; index++) {
              formElements[index].disabled = false;
            }

            // Display Retry message
            welcomeAlertMsg.innerText = `Not Approved Yet! Try Again!`;
          }
        }, 1000);
        break;
      case 'exceed-max-capacity':
        // display message
        welcomeAlert.style.display = 'block';
        welcomeAlertMsg.innerText = 'Exceed Max Capacity of Room!! Try Again!';
        break;
    }
  });
});

// EventListener (cameraSelect):
//   When camera changes, changing both video's source
cameraSelect.addEventListener('change', async () => {
  // Restart/Create new camera video
  await camStart();

  // Change video tracks for the peer connection
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === 'video');
    videoSender.replaceTrack(videoTrack);
  }
});

// EventListener (muteBtn): mute/unmute the recording audio
muteBtn.addEventListener('click', () => {
  myStream.getAudioTracks().forEach((track) => {
    track.enabled = !track.enabled;
  });
  if (!muted) {
    muted = true;
    muteBtn.innerText = 'Unmute';
  } else {
    muted = false;
    muteBtn.innerText = 'Mute';
  }
});

// EventListener (cameraBtn): Turn on/off camera
cameraBtn.addEventListener('click', () => {
  myStream.getVideoTracks().forEach((track) => {
    track.enabled = !track.enabled;
  });
  if (cameraOff) {
    cameraOff = false;
    cameraBtn.innerText = 'Turn Camera Off';
  } else {
    cameraOff = true;
    cameraBtn.innerText = 'Turn Camera On';
  }
});

// EventListener (hangUpBtn): Leave Call
//   Notify the remotePeer('leave-room') and leave call
hangUpBtn.addEventListener('click', () => {
  hangUp();
});

// SocketIO: "join-room" event - Another user asks to join currentRoom
// Current user needs to approve or reject the request within 30 second
socket.on('join-room', (nickname, socketId) => {
  // Save peer's nickname
  peerNickname = nickname;

  // Display modal (count 30 second)
  const confirmJoinModal = modalWrapper.querySelector('#confirm-join');
  modalWrapper.style.display = 'flex';
  confirmJoinModal.style.display = 'flex';
  confirmJoinModal.querySelector('#request-nickname').innerText = nickname;
  waitApprovalObj.counter = 30;
  waitApprovalObj.interval = setInterval(() => {
    // Display Message
    const modalMsg = confirmJoinModal.querySelector('#confirm-message');
    modalMsg.innerText = `Want to approve the user to join the chat? (${waitApprovalObj.counter})`;

    if (waitApprovalObj.counter !== 0) {
      // Reduce counter by 1
      --waitApprovalObj.counter;
    } else {
      // Timeout (30 second passed)
      clearInterval(waitApprovalObj.interval);

      // Hide Modal
      modalWrapper.style.display = 'none';
      confirmJoinModal.style.display = 'none';
    }
  }, 1000);

  // Press Approve
  const approveBtn = confirmJoinModal.querySelector('#approve');
  approveBtn.addEventListener('click', () => {
    // Emit message indicating the peer has been approved
    socket.emit('approve-peer', roomName, socketId);
    // Hide Modal
    modalWrapper.style.display = 'none';
    confirmJoinModal.style.display = 'none';
  });

  // Press Decline
  const declineBtn = confirmJoinModal.querySelector('#decline');
  declineBtn.addEventListener('click', () => {
    // Emit message indicating the peer has been declined
    socket.emit('decline-peer', socketId);
    // Hide Modal
    modalWrapper.style.display = 'none';
    confirmJoinModal.style.display = 'none';
  });
});

// SocketIO: 'approved' event - When remote peer approved to join the room
//   Send the room owner a 'hello' message
socket.on('approved', async () => {
  // Init call
  await camStart();
  makeConnection(); // create webRTC Connection
  // Display
  displayCall();

  // Notify to room owner
  socket.emit('hello', roomName);
});

// SocketIO: 'declined' event - When remote peer decline to join the room
//   Display message and enable form to enter another room name and nickname
socket.on('declined', () => {
  // Clear Interval showing wait message
  clearInterval(waitApprovalObj.interval);
  // Display message
  welcomeAlertMsg.innerText = 'Declined to join the room!! Try Again!!';

  // Enable form
  const formElements = welcomeForm.elements;
  for (let index = 0; index < formElements.length; index++) {
    formElements[index].disabled = false;
  }
});

// SocketIO: 'welcome' event - When remote peer successfully joined the room
//   Send the webRTC offer to the remote peer
socket.on('welcome', async () => {
  myDataChannel = myPeerConnection.createDataChannel('chat');
  myDataChannel.addEventListener('message', (messageEvent) => {
    console.log(messageEvent);
  });
  // After join, send WebRTC Offer
  const webRTCOffer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(webRTCOffer);
  socket.emit('offer', roomName, webRTCOffer);
});

// SocketIO: 'offer' event - When the room owner send the webRTCOffer
//   Remote peer should "answer" to the offer
socket.on('offer', async (webRTCOffer) => {
  // Set dataChannel for chatting
  myPeerConnection.addEventListener('datachannel', (dataChannelEvent) => {
    myDataChannel = dataChannelEvent.channel;
    myDataChannel.addEventListener('message', (message) => {
      console.log(message);
    });
  });
  // Setup remoteDescription to establish connection
  myPeerConnection.setRemoteDescription(webRTCOffer);
  // Create webRTCAnswer
  const webRTCAnswer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(webRTCAnswer);
  socket.emit('answer', roomName, webRTCAnswer);
});

// SocketIO: 'answer' event - When the remote peer reply back to
//   the previous offer.
socket.on('answer', (webRTCAnswer) => {
  // Set remote description of peer connection
  myPeerConnection.setRemoteDescription(webRTCAnswer);
});

// SocketIO: 'ice-candidate' event
//   - Both party should share the ice-candidate information
socket.on('ice-candidate', (iceCandidate) => {
  myPeerConnection.addIceCandidate(iceCandidate);
});

// SocketIO: 'peer-leaving' event
//   - Display modal popup that peer has been left
socket.on('peer-leaving', () => {
  // Peer disconnected
  peerNickname = '';
  // Remote peerVideo
  peerVideo.srcObject.getTracks().forEach((track) => {
    track.stop();
  });
  peerVideo.srcObject = null;

  // Display Modal
  const disconnectedPeer = modalWrapper.querySelector('#disconnected-peer');
  modalWrapper.style.display = 'flex';
  disconnectedPeer.style.display = 'flex';

  // Press Leave Room Button
  const leaveRoomBtn = disconnectedPeer.querySelector('button#leave-room');
  leaveRoomBtn.addEventListener('click', () => {
    // Hide Modal
    modalWrapper.style.display = 'none';
    disconnectedPeer.style.display = 'none';
    // Leave Chat Room
    hangUp();
  });

  // Press Stay Button
  const stayRoomBtn = disconnectedPeer.querySelector('button#stay-room');
  stayRoomBtn.addEventListener('click', () => {
    // Hide Modal
    modalWrapper.style.display = 'none';
    disconnectedPeer.style.display = 'none';
  });
});

// Website need to display the main screen at the beginning
displayMain();
