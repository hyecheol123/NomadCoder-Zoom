# 1-on-1 Private Video Call

Followed the lecture contents to build Zoom Clone.
Used NodeJS, express, SocketIO, WebRTC, Pug (Template Engine), and CSS/vanilla-JS.

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
- Fix selecting camera
  - Smartphone may have more than one main cameras.
  - Reference: https://github.com/webrtc/samples/blob/gh-pages/src/content/devices/input-output/js/main.js
- Set Nickname before establish connection.
- Ask room owners whether to allow joining the new member or not upon connection.
  - When the room owner decline the request, the other user should return to the main screen after warning.
- When one user exit, the other user is asked to leave or wait for other participants.
- Remove stream when a peer leaves the room.
- P2P chat (Use Datachannel)
  - When new message arrives, automatically pop-up chat messages
- Design for both mobile and desktop website.

| ![](https://raw.githubusercontent.com/hyecheol123/NomadCoder-Zoom/main/img/1-on-1-private-video-call/PrivateCall_Join_View.png) |
| :-----------------------------------------------------------------------------------------------------------------------------: |
|                                    _Demo Image of 1 on 1 Private Video Call: Join Room View_                                    |

| ![](https://raw.githubusercontent.com/hyecheol123/NomadCoder-Zoom/main/img/1-on-1-private-video-call/Private_Call_Chat_Demo.png) |
| :------------------------------------------------------------------------------------------------------------------------------: |
|                              _Demo Image of 1 on 1 Private Video Call: Chat Room View (Landscape)_                               |

| ![](https://raw.githubusercontent.com/hyecheol123/NomadCoder-Zoom/main/img/1-on-1-private-video-call/Private_Call_Chat_Demo_Portrait.png) |
| :---------------------------------------------------------------------------------------------------------------------------------------: |
|                                   _Demo Image of 1 on 1 Private Video Call: Chat Room View (Portrait)_                                    |

Code Link: https://github.com/hyecheol123/NomadCoder-Zoom/tree/main/1-on-1-private-video-call  
Demo Link: https://demo1.hcjang.com/private-video-call/
