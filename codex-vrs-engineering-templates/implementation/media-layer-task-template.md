Implement a bounded media layer improvement.

OBJECTIVE
Improve WebRTC session reliability.

SCOPE
Focus only on media transport or connection state handling.

FILES

media connection manager

peer connection handlers

session state listeners

DO NOT CHANGE

signaling message contracts

queue system

auth behavior

RULES

use RTCPeerConnection.connectionState as primary signal

treat disconnected as temporary

treat failed or closed as terminal

OUTPUT EXACTLY

Media Layer Change Report
1 Files changed
2 Behavior improved
3 Commands run
4 Results
5 Remaining media risks
