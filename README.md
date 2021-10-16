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

## Project

### Zoom Clone

Followed the lecture contents to build Clone of Zoom.  
Used NodeJS, WebRTC, ~~Websockets~~, SocketIO, Pug (Template Engine), and HTML/CSS/vanilla-JS.

**Feature List (From Lecture)**

- Chat
  - Sending/Receiving Texts

**What I added/modified**

|             ![]()              |
| :----------------------------: |
| _Demo Image of Zoom Clone App_ |

Code Link:
