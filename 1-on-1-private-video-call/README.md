# 1-on-1 Private Video Call

Followed the lecture contents to build Zoom Clone.
Used NodeJS, express, SocketIO, WebRTC, Pub (Template Engine), and CSS/vanilla-JS.

Using WebRTC, all the video, audio, and text messages does not pass to the server.  
Only the participants share the contents; server only used to create connections between the peers

**Feature List (From Lecture)**

- Create Private Video Call Rooms (SocketIO)
- Establish WebRTC Connection between peers to stream video/audio/text
  - Use SocketIO for signaling server
  - Offer/Answer/IceCandidate/AddStream
- Change Camera
- Add list of STUN servers

**What I added/modified**

- WebRTC: Use `track` event instead of `addstream` event
  - `addstream` event depreciated.
- TODO: Fix selecting camera
  - Smartphone may have more than one main cameras.
  - Reference: https://github.com/webrtc/samples/blob/gh-pages/src/content/devices/input-output/js/main.js
- TODO: Set Nickname before establish connection.
- TODO: Ask room owners whether to allow joining the new member or not upon connection.
  - When the room owner decline the request, the other user should return to the main screen after warning.
- TODO: When one user exit, the other user is asked to leave or wait for other participants.
- TODO: Remove stream when a peer leaves the room.
- TODO: P2P chat (Use Datachannel)
- TODO: Design for both mobile and desktop website.

|           ![]()            |
| :------------------------: |
| _Demo Image of Zoom Clone_ |

Code Link: https://github.com/hyecheol123/NomadCoder-Zoom/tree/main/1-on-1-private-video-call
