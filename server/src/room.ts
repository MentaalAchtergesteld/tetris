import { Socket } from "socket.io";

export class Room {
	public id: string;
	public players: Socket[] = [];
	public isOpen: boolean = true;
	
	constructor(id: string) {
		this.id = id;
	}

	public addPlayer(socket: Socket): boolean {
		if (!this.isOpen || this.players.length >= 2) return false;

		this.players.push(socket);
		socket.join(this.id);

		if (this.players.length == 2) this.startGame();
		return true;
	}

	public removePlayer(socketId: string) {
		this.players = this.players.filter(p => p.id != socketId);

		if (!this.isOpen && this.players.length == 1) {
			const winner = this.players[0];
			winner.emit("game_over", { won: true, reason: "opponent_disconnect" });
			this.close();
		}
	}

	private startGame() {
		this.isOpen = false;
		console.log(`Game started in room ${this.id}.`);

		const sharedSeed = Math.floor(Math.random() * 100000);

		this.players.forEach(player => {
			const opponent = this.players.find(p => p.id != player.id);

			player.on("action", action => {
				opponent?.emit("action", action);	
			});

			player.emit("match_start", {
				seed: sharedSeed,
				opponentId: opponent?.id
			});
		});
	}

	private close() {
		this.isOpen = false;
	}
}
