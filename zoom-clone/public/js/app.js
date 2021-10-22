// HTML Elements
const myFace = document.getElementById('myFace');
const muteBtn = document.getElementById('mute');
const cameraBtn = document.getElementById('camera');
const cameraSelect = document.getElementById('cameras');

// Will use same doemain (window.location) address to establish connection
const socket = io.connect(window.location.host, {
  path: `${window.location.pathname}socket.io`,
});

let myStream;
let muted = false;
let cameraOff = false;

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

getMedia();

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
