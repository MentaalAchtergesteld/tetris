import { Player, ServerMatch } from "./server_match.js";

export class Room {
	public id: string;
	private players: Player[] = [];

	private currentMatch: ServerMatch | null = null;

	public isOpen: boolean = true;

	constructor(id: string) {
		this.id = id;
	}

	private handleMatchEnd(winnerId: string) {
		console.log(`Match finished. Winner: ${winnerId}`);
		this.currentMatch = null;

		this.players.forEach(p => {
			p.isReady = false;
			p.emit("lobby_state", { status: "waiting"} );
		});

		this.isOpen = true;
	}

	private startGame() {
		console.log(`Starting match in Room ${this.id}`);
		this.currentMatch = new ServerMatch(this.players);
		this.isOpen = false;

		this.currentMatch.events.on("matchEnd", (winnerId: string) => this.handleMatchEnd(winnerId));
	}

	private checkReadyStatus() {
		const allReady = this.players.every(p => p.isReady);
		if (allReady && this.players.length >= 2) this.startGame();
	}

	public addPlayer(player: Player) {
		this.players.push(player);

		player.on("action", (packet) => {
			if (!this.currentMatch) return;
			this.currentMatch.onPlayerAction(player.id, packet);
		});

		player.on("ready", () => this.checkReadyStatus());
	}

	public removePlayer(playerId: string) {
		this.players = this.players.filter(p => p.id != playerId);

		if (this.currentMatch) {
			console.log(`Player ${playerId} has left during a match.`);
			this.currentMatch.forceEnd(playerId);
			this.currentMatch = null;
		}

		if (this.players.length > 0) {
			this.players[0].emit("lobby_state", { status: "waiting_for_opponent" } );
			this.players[0].isReady = false;
			this.isOpen = true;
		}
	}

	public hasPlayer(id: string) { return this.players.find(p => p.id == id) != null }
	public isEmpty() { return this.players.length == 0; }
}
