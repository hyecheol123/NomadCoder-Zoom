# Simple Chats

Followed the lecture contents to build Open Chats.  
Used NodeJS, ~~Websockets~~, SocketIO, Pug (Template Engine), and CSS/vanilla-JS.

Have simplified designs (Only works on desktop / design for mobile site is neither implemented nor tested)

**Feature List (From Lecture)**

- Chat
  - Sending/Receiving Texts
  - Chat room (Groups of WebSockets)
  - Set nickname
  - Show the list of rooms in the application
    - Should eliminate the "private" rooms, having same name with the socketID (listed in `sids` Map), from the `rooms` Map.
  - Show how many people in the room
  - Admin Panel to monitor sockets, and rooms.

**What I added/modified**

- Chat
  - Set nickname (Max length of 10) before user enter the room
  - Room name cannot exceed 20 characters
  - Show the existing room list when users choose which room to enter
  - update the current opened room list every 3 seconds before the user enters the room.
  - Exit the room to join another room
  - Change nickname (logout)
    - Need to exit the room to change the nickname
  - Show when message sent
  - Host Admin Panel on local server
    - Instruction & Code repo: https://github.com/socketio/socket.io-admin-ui#client-side
- Add simple design
  - Change chat message form's input to textarea to automatically wrap long messages.
  - When `enter` pressed inside the text area, the message will send.

|           ![]()            |
| :------------------------: |
| _Demo Image of Open Chats_ |

Code Link: https://github.com/hyecheol123/NomadCoder-Zoom/tree/main/open-chats  
Demo Link: https://demo1.hcjang.com/open-chats/
