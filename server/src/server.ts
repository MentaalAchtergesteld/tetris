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
	cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = 9000;

let rooms: Room[] = [];

io.on("connection", (socket: Socket) => {
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
