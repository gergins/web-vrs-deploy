# Reconnect Flow

1. client websocket disconnect detected
2. presence marked unstable
3. session state moves to reconnecting when applicable
4. reconnect grace timer starts
5. client reconnects websocket
6. client sends client.reconnect
7. client re-joins authorized session
8. signaling resumes
9. peer connection either recovers or is renegotiated
10. session returns to connected or fails after grace timeout
