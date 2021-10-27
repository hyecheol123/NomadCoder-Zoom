// Frequently used HTML Element
const welcomeView = document.getElementById('welcome');
const welcomeForm = welcomeView.querySelector('form');
const callView = document.getElementById('call');
const callContent = document.getElementById('call-content');
const cameraSelect = callContent.querySelector('#myStream #camera-selection');
const myVideo = callContent.querySelector('#myStream #myVideo');

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

// Will use same domain (window.location) address to establish connection
const socket = io.connect(window.location.host, {
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

  // EventListner: iceCandidateEvent --> Receive iceCandidateEvent
  // The iceCandiate information needs to be transferred to the remote peer
  myPeerConnection.addEventListener('icecandidate', (iceCandidateEvent) => {
    socket.emit('ice-candidate', roomName, iceCandidateEvent.candidate);
  });

  // // EventListener: addStream --> RTCPeerConnection get new MediaStream object
  // // Display the new media stream as the peer's video
  // // This event has been depreciated
  // myPeerConnection.addEventListener('addstream', (addstreamEvent) => {
  //   const peerStream = document.getElementById('peerStream');
  //   peerStream.srcObject = addstreamEvent.stream;
  // });

  // EventListener: trackEvent --> RTCPeerConnection get new Track
  // Display new video track as the peer's video
  myPeerConnection.addEventListener('track', (trackEvent) => {
    const peerStream = document.getElementById('peerStream');
    peerStream.srcObject = trackEvent.streams[0];
  });

  // Add current media stream to the RTCPeerConnection
  //   to send the stream to peer
  myStream.getTracks().forEach((track) => {
    myPeerConnection.addTrack(track, myStream);
  });
}

// EventListener: Process user's request to join the room
welcomeForm.addEventListener('submit', async (submitEvent) => {
  submitEvent.preventDefault();

  // User Inputs
  const nickname = welcomeForm.querySelector('#nickname').value;
  const roomName = welcomeForm.querySelector('#room-name').value;

  // Init call
  await camStart();
  makeConnection(); // create webRTC Connection before joining the room

  // Signaling Server
  socket.emit('join-room', nickname, roomName);

  // Display
  displayCall();
});

// let myDataChannel;
// let muted = false;
// let cameraOff = false;
// let roomName;

// muteBtn.addEventListener('click', () => {
//   myStream.getAudioTracks().forEach((track) => {
//     track.enabled = !track.enabled;
//   });
//   if (!muted) {
//     muted = true;
//     muteBtn.innerText = 'Unmute';
//   } else {
//     muted = false;
//     muteBtn.innerText = 'Mute';
//   }
// });

// cameraBtn.addEventListener('click', () => {
//   myStream.getVideoTracks().forEach((track) => {
//     track.enabled = !track.enabled;
//   });
//   if (cameraOff) {
//     cameraOff = false;
//     cameraBtn.innerText = 'Turn Camera Off';
//   } else {
//     cameraOff = true;
//     cameraBtn.innerText = 'Turn Camera On';
//   }
// });

// cameraSelect.addEventListener('input', async () => {
//   await getMedia(cameraSelect.value);
//   if (myPeerConnection) {
//     const videoTrack = myStream.getVideoTracks()[0];
//     const videoSender = myPeerConnection
//       .getSenders()
//       .find((sender) => sender.track.kind === 'video');
//     videoSender.replaceTrack(videoTrack);
//   }
// });

// socket.on('welcome', async () => {
//   myDataChannel = myPeerConnection.createDataChannel('chat');
//   myDataChannel.addEventListener('message', (messageEvent) => {
//     console.log(messageEvent);
//   });
//   // After join, send WebRTC Offer
//   const webRTCOffer = await myPeerConnection.createOffer();
//   myPeerConnection.setLocalDescription(webRTCOffer);
//   socket.emit('offer', roomName, webRTCOffer);
// });

// socket.on('offer', async (webRTCOffer) => {
//   myPeerConnection.addEventListener('datachannel', (dataChannelEvent) => {
//     myDataChannel = dataChannelEvent.channel;
//     myDataChannel.addEventListener('message', (message) => {
//       console.log(message);
//     });
//   });
//   myPeerConnection.setRemoteDescription(webRTCOffer);
//   const webRTCAnswer = await myPeerConnection.createAnswer();
//   myPeerConnection.setLocalDescription(webRTCAnswer);
//   socket.emit('answer', roomName, webRTCAnswer);
// });

// socket.on('answer', (webRTCAnswer) => {
//   myPeerConnection.setRemoteDescription(webRTCAnswer);
// });

// socket.on('ice-candidate', (iceCandidate) => {
//   myPeerConnection.addIceCandidate(iceCandidate);
// });

// Website need to display the main screen at the beginning
displayMain();
