# NomadCoder-Zoom

Clone Coding Repository for "Zoom Clone Coding" Course of NomadCoder

Lecture Link: https://nomadcoders.co/noom

- Lecture language: English (Administrated in Korean)

## Purpose / Goal

I take the course to recap JavaScript basics and be familiar with some JS functions that will use frequently in the website.
Also, by taking this course, I expects to experience `WebSockets`, `SocketIO`, and `WebRTC`.

At the end of the course, I am expected to build both front-end and back-end of a famous video conference application, [zoom](zoom.us).

## What I Learn

- Basics of using [Pug](https://pugjs.org/api/getting-started.html), the template engine, with [express](http://expressjs.com/).
- [MVP CSS](https://andybrewer.github.io/mvp/), making default design of HTML elements look better.
- Using [nodemon](https://nodemon.io/) to automatically restart server when files changed.
- **WebSocket (wss)** clients first handshake with server.
  Once connection established, server and clients can send messages each other without requesting those.
  It is bi-directional connection.
  It knows whether the server/client is connected, closed, and sent message in real time.
  - Compare to the HTTP, client request and server response.
    It is stateless, meaining that the backend does not remember the state of client.
  - [**ws**](https://www.npmjs.com/package/ws) is used to build WebSocket server and to communicate with other WebSocket servers.
  - the browsers has [built-in client for WebSocket **(WebSocket API)**](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket).
- [**SocketIO**](https://socket.io/) is a library that enables real-time, bidrectional, and event-driven communication.
  - While WebSocket is standardized way (HTML5) to do real-time communication, SocketIO is not.
  - It support various methods to enable real-time communication, including WebSocket, Pooling, Streaming, Flash Socket, etc.
    When it initiate the communication, it establishes connection with the most suitable way.
    Therefore, though the browser does not support WebSocket, SocketIO enables the browser to communicate in bi-direction.
  - SocketIO has more advanced features (including room, broadcasting, etc.) than WebSocket.
    - Room is supported natively, using **Socket.join(\<room name>)** function.
      - List the rooms socket currently in: **Socket.rooms**.
      - On server, specify the recipient of message by using `Socket.to(<room name / socket ID>)`
        - Will send message except for the sender
        - Some other ways to specifiy recipient: https://stackoverflow.com/questions/10058226/send-response-to-all-clients-except-sender
  - Need to import a dedicated javascript file to use it from the web browser.
    - `<Server_Host_URL>/socket.io/socket.io.js`
    - The API documentation for `socketIO` can be found in https://socket.io/docs/v4/
  - Using SocketIO, we can send any events, while WebSocket only support `message` event.
    - No need to stringify object to generate string.
    - Able to pass as many arguments as we want when we emit a message
      - Able to trigger a functions on front-end (provided as the last argument while emit a message) from back-end (also able to pass arguments)
  - [**Adapter**](https://socket.io/docs/v4/adapter/) is syncronizing the real-time applications among different servers.
    - By default, Socket.IO uses In-Memory adapter.
      When server restarts, all room, message, and socket disappear.
    - Using clustered servers, they cannot share the same memory pool; therefore, to access to other connections in different server, we need to use other adapter rather than In-Memory.
    - Contain information about who is connected and how many rooms are created.
  - **Server.sockets.emit()** to notify everyone
- [**Map**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map): Holds key-value pairs and remember the insertion orders.
  Any value (either objects or primitive values) can be used as either key or a value
  - Iterating Map gives (value, map, key) pair. (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/forEach)
- [**Set**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set): store **unique** values of any type.

## Project

### Zoom Clone

Followed the lecture contents to build Clone of Zoom.  
Used NodeJS, WebRTC, ~~Websockets~~, SocketIO, Pug (Template Engine), and HTML/CSS/vanilla-JS.

**Feature List (From Lecture)**

- Chat
  - Sending/Receiving Texts
  - Chat room (Groups of WebSockets)
  - Set nickname
  - Show the list of rooms in the application
    - Should eliminate the "private" rooms, having same name with the socketID (listed in `sids` Map), from the `rooms` Map.
  - Show how many people in the room

**What I added/modified**

- Chat
  - Set nickname before user enter the room
  - Show the existing room list when users choose which room to enter
  - Does not implement left/join alarm
    - In lecture, the application sending the list of all rooms when users join/left the room, but I believe there is a better way and timing to get the list of rooms.
      (e.g. When user exit from current room to join another)
    - To update the current opened room list, it will automatically pull the room list every 3 seconds before the user enters the room.
  - Exit the room to join another room
  - Change nickname
    - Need to exit the room to change the nickname

|             ![]()              |
| :----------------------------: |
| _Demo Image of Zoom Clone App_ |

Code Link: https://github.com/hyecheol123/NomadCoder-Zoom
