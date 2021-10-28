// Frequently used HTML Element
const welcomeView = document.getElementById('welcome');
const welcomeForm = welcomeView.querySelector('form');
const callView = document.getElementById('call');
const callContent = callView.querySelector('#call-content');
const cameraSelect = callContent.querySelector('#myStream #camera-selection');
const myVideo = callContent.querySelector('#myStream #myVideo');
const cameraBtn = callContent.querySelector('#myStream button#camera');
const muteBtn = callContent.querySelector('#myStream button#mute');
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

// Will use same domain (window.location) address to establish connection
let socket = io.connect(window.location.host, {
  path: `${window.location.pathname}socket.io`,
});

/**
 * Display Main/Welcome view
 */
function displayMain() {
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
  //   const peerVideo = document.getElementById('peerVideo');
  //   peerVideo.srcObject = addstreamEvent.stream;
  // });

  // EventListener (myPeerConnection):
  //   trackEvent --> RTCPeerConnection get new Track
  // Display new video track as the peer's video
  myPeerConnection.addEventListener('track', (trackEvent) => {
    const peerVideo = document.getElementById('peerVideo');
    peerVideo.srcObject = trackEvent.streams[0];
  });

  // Add current media stream to the RTCPeerConnection
  //   to send the stream to peer
  myStream.getTracks().forEach((track) => {
    myPeerConnection.addTrack(track, myStream);
  });
}

// EventListener (WelcomeForm): Process user's request to join the room
welcomeForm.addEventListener('submit', async (submitEvent) => {
  submitEvent.preventDefault();

  // HTML Alert Element
  const waitAlert = welcomeView.querySelector('#wait-approval');
  const declineRequestAlert = welcomeView.querySelector('#declined-request');

  // Hide alerts
  waitAlert.style.display = 'none';
  declineRequestAlert.style.display = 'none';

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
        // Contain information for the approval request
        const waitApprovalObj = {
          interval: null,
          counter: 0,
        };

        // disable form
        const formElements = welcomeForm.elements;
        for (let index = 0; index < formElements.length; index++) {
          formElements[index].disabled = true;
        }

        // display message (Count 30 second)
        waitAlert.style.display = 'block';
        waitApprovalObj.counter = 30;
        waitApprovalObj.interval = setInterval(() => {
          // Display Message
          const alertMsg = waitAlert.querySelector('span');
          alertMsg.innerText = `Waiting for Approval (${waitApprovalObj.counter})`;

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
            alertMsg.innerText = `Not Approved Yet! Try Again!`;
          }
        }, 1000);
        break;
      case 'exceed-max-capacity':
        // TODO: display message
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

// SocketIO: "join-room" event - Another user asks to join currentRoom
// Current user needs to approve or reject the request within 30 second
socket.on('join-room', (nickname, socketId) => {
  // Contain information for the approval request
  const approvalObj = {
    interval: null,
    counter: 0,
  };
  peerNickname = nickname;

  // Display modal (count 30 second)
  const confirmJoinModal = modalWrapper.querySelector('#confirm-join');
  modalWrapper.style.display = 'flex';
  confirmJoinModal.style.display = 'flex';
  confirmJoinModal.querySelector('#request-nickname').innerText = nickname;
  approvalObj.counter = 30;
  approvalObj.interval = setInterval(() => {
    // Display Message
    const alertMsg = confirmJoinModal.querySelector('#confirm-message');
    alertMsg.innerText = `Want to approve the user to join the chat? (${approvalObj.counter})`;

    if (approvalObj.counter !== 0) {
      // Reduce counter by 1
      --approvalObj.counter;
    } else {
      // Timeout (30 second passed)
      clearInterval(approvalObj.interval);

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
    socket.emit('decline-peer', roomName, socketId);
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

// TODO: declined event

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

// Website need to display the main screen at the beginning
displayMain();
