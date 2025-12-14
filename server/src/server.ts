import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server, Socket } from "socket.io";
import { Room } from "./room.js";

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = 9000;

let rooms: Room[] = [];

io.on("connection", (socket: Socket) => {
	console.log(`New connection: ${socket.id}`);

	socket.on("join_queue", () => {
		console.log(`${socket.id} is searching for a match...`);

		let room = rooms.find(r => r.isOpen);

		if (room) {
			console.log(`Match found! Joining room ${room.id}`);
			room.addPlayer(socket);
		} else {
			const newRoomId = `room_${Date.now()}`;
			console.log(`No match found, creating new room: ${newRoomId}`);

			room = new Room(newRoomId);
			rooms.push(room);
			room.addPlayer(socket);
		}
	});

	socket.on("disconnect", () => {
		console.log(`Disconnect: ${socket.id}`);

		const room = rooms.find(r => r.players.some(p => p.id == socket.id));

		if (room) {
			room.removePlayer(socket.id);
			if (room.players.length == 0) {
				rooms = rooms.filter(r => r.id != room.id);
				console.log(`Room ${room.id} deleted (empty).`);
			}
		}
	});
});

httpServer.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`)
});
