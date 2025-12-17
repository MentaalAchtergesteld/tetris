import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server, Socket } from "socket.io";
import { Room } from "./room.js";
import { Player } from "./server_match.js";
import { Client2ServerEvents, PacketType, Server2ClientEvents } from "@tetris/shared";

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server<Client2ServerEvents, Server2ClientEvents>(httpServer, {
	cors: { origin: "*", methods: ["GET", "POST"], credentials: true }
});

const PORT = 9000;

let rooms: Room[] = [];

io.on("connection", (socket: Socket) => {
	// Supposed connection flow
	// (C2S) JoinQueue -> Matchmaking -> (S2C) JoinMatch -> (S2C) Seed -> (C2S) Ready ->
	// Loop until max points are given out and winner is decided:
	// [ (S2C) StartMatch -> Loop until game end: [ (C2S) Action -> (S2C) State/Action/Garbage ] -> (S2C) EndMatch ] ->
	// (S2C) FinishMatch -> Wait until all players left: [ (C2S) -> LeaveMatch ] -> CloseRoom 
	//
	// Required packets:
	// (C2S) JoinQueue (possible user ID for when accounts are added)
	// (S2C) JoinMatch (with opponent ID, possible opponent data although that could be retrieved through another endpoint, and other match data like points to score)
	// (S2C) Seed (for matching deterministic randomness)
	// (C2S) Ready (done using socket, not provided user ID)
	// (S2C) StartMatch
	// (C2S) Action (GameAction)
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
	
	const player = new Player(socket);
	console.log(`New connection: ${player.id} (${player.name})`);

	socket.on(PacketType.JoinQueue, () => {
		console.log(`${player.id} is searching for a match...`);
		let room = rooms.find(r => r.isOpen);
		if (room) {
			console.log(`Match found! Joining room ${room.id}.`);
		} else {
			const newRoomId = `room_${Date.now()}`;
			console.log(`No match found, creating new room: ${newRoomId}.`);

			room = new Room(newRoomId);
			rooms.push(room);
		}

		room.addPlayer(player);
	});

	socket.on("disconnect", () => {
		console.log(`Disconnect: ${player.id}`);
		const room = rooms.find(r => r.hasPlayer(player.id));

		if (!room) return;
		room.removePlayer(player.id);

		if (room.isEmpty()) {
			rooms = rooms.filter(r => r.id != room.id);
			console.log(`Room ${room.id} deleted (empty).`);
		}
	});
});

httpServer.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`)
});
