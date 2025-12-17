import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server, Socket } from "socket.io";
import { Room } from "./room.js";
import { Player } from "./server_match.js";
import { C2SEvents, S2CEvents } from "@tetris/shared";

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server<C2SEvents, S2CEvents>(httpServer, {
	cors: { origin: "*", methods: ["GET", "POST"], credentials: true }
});

let queue: Player[] = [];
let rooms: Room[] = [];

function cleanRooms() {
	rooms = rooms.filter(r => r.isEmpty());
}

function matchmake() {
	cleanRooms();

	let currentRoom;
	for (const player of queue.reverse()) {
		if (!currentRoom) currentRoom = rooms.find(r => r.isOpen());
		if (!currentRoom) {
			currentRoom = new Room();
			rooms.push(currentRoom);
		};

		const success = currentRoom.addPlayer(player);
		if (!success) break;
		queue.pop();
	}
}

function onConnection(socket: Socket) {
	const player = new Player(socket);
	console.log(`${player.name} connected!`);
	queue.push(player);
	matchmake();
}

io.on("connection", onConnection);

// Supposed connection flow
// (C2S) JoinQueue -> Matchmaking -> (S2C) JoinRoom -> Repeat until room is full: [ (S2C) PlayerJoined ] -> (S2C) Seed -> (C2S) Ready ->
// Loop until max points are given out and winner is decided:
// [ (S2C) StartMatch -> Loop until game end: [ (C2S) Action -> (S2C) State/Action/Garbage ] -> (S2C) EndMatch ] ->
// (S2C) FinishMatch -> Wait until all players left: [ (C2S) -> LeaveRoom ] -> CloseRoom 
//
// Required packets:
// (C2S) JoinQueue (possible user ID for when accounts are added)
// (S2C) JoinRoom
// (S2C) PlayerJoined (with ID)
// (S2C) Seed (for matching deterministic randomness)
// (C2S) Ready (done using socket, not provided user ID)
// (S2C) StartMatch
// (C2S) Action (GameAction)
// (S2C) Action (GameAction)
// (S2C) SelfState (state of the player itself, for syncing)
// (S2C) OppState (state of the opponent, for syncing)
// (S2C) GarbageIn (when receiving garbage from opponent)
// (S2C) GarbageOut (when sending out garbage)
// (S2C) EndMatch (with winner ID)
// (S2C) FinishMatch (sent when all games have been played, with points scored and final winner)
// (C2S) LeaveMatch
// POSSIBLE FUTURE ADDITIONS:
// (C2S) ChatMessage (for in-game chat)
// (S2C) ChatMessage (for in-game chat)
