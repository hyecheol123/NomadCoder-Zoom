// HTML Elements
const myFace = document.getElementById('myFace');
const muteBtn = document.getElementById('mute');
const cameraBtn = document.getElementById('camera');
const cameraSelect = document.getElementById('cameras');
const welcomeView = document.getElementById('welcome');
const welcomeForm = welcomeView.querySelector('form');
const callView = document.getElementById('call');

// Display
callView.hidden = true;

// Will use same doemain (window.location) address to establish connection
const socket = io.connect(window.location.host, {
  path: `${window.location.pathname}socket.io`,
});

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === 'videoinput');
    const currentCamera = myStream.getVideoTracks()[0].label;
    cameras.forEach((camera) => {
      const option = document.createElement('option');
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera === camera.label) {
        option.selected = true;
      }
      cameraSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId = undefined) {
  try {
    if (deviceId) {
      myStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { deviceId: { exact: deviceId } },
      });
    } else {
      myStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: 'user' },
      });
      await getCameras();
    }
    myFace.srcObject = myStream;
  } catch (err) {
    console.log(err);
  }
}

function makeConnection() {
  myPeerConnection = new RTCPeerConnection();
  myStream.getTracks().forEach((track) => {
    myPeerConnection.addTrack(track, myStream);
  });
}

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

cameraSelect.addEventListener('input', async () => {
  await getMedia(cameraSelect.value);
});

welcomeForm.addEventListener('submit', async (submitEvent) => {
  submitEvent.preventDefault();

  const input = welcomeForm.querySelector('input');

  // Init call
  welcomeView.hidden = true;
  callView.hidden = false;
  await getMedia();
  makeConnection(); // create webRTC Connection before joining the room

  socket.emit('join-room', input.value);
  roomName = input.value;
  input.value = '';
});

socket.on('welcome', async () => {
  // After join, send WebRTC Offer
  const webRTCOffer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(webRTCOffer);
  socket.emit('offer', roomName, webRTCOffer);
});

socket.on('offer', async (webRTCOffer) => {
  myPeerConnection.setRemoteDescription(webRTCOffer);
  const webRTCAnswer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(webRTCAnswer);
  socket.emit('answer', roomName, webRTCAnswer);
});

socket.on('answer', (webRTCAnswer) => {
  myPeerConnection.setRemoteDescription(webRTCAnswer);
});
