import { LobbyState, PacketType, Server2ClientEvents } from "@tetris/shared";
import { Player, ServerMatch } from "./server_match.js";

export class Room {
	public id: string;
	private players: Player[] = [];

	private currentMatch: ServerMatch | null = null;

	public isOpen: boolean = true;

	constructor(id: string) {
		this.id = id;
	}

	private broadcastToPlayers<T extends keyof Server2ClientEvents>(event: T, ...args: Parameters<Server2ClientEvents[T]>) {
		this.players.forEach(p => p.emit(event, ...args));
	}

	private handleMatchEnd(winnerId: string) {
		console.log(`Match finished. Winner: ${winnerId}`);
		this.currentMatch = null;

		this.players.forEach(p => {
			p.isReady = false;
			p.emit(PacketType.LobbyState, { state: LobbyState.WaitingForReady });
		});

		this.isOpen = true;
	}

	private startGame() {
		console.log(`Starting match in Room ${this.id}`);
		this.currentMatch = new ServerMatch(this.players);
		this.isOpen = false;

		this.currentMatch.events.on("matchEnd", (winnerId: string) => this.handleMatchEnd(winnerId));
	}

	private checkLobbyState() {
		if (this.players.length < 2) {
			this.broadcastToPlayers(PacketType.LobbyState, { state: LobbyState.WaitingForOpp });
			return;
		}

		const allReady = this.players.every(p => p.isReady);

		if (allReady) this.startGame();
		else this.broadcastToPlayers(PacketType.LobbyState, { state: LobbyState.WaitingForReady });
	}

	public addPlayer(player: Player) {
		this.players.push(player);

		this.checkLobbyState();
		player.on(PacketType.Ready, () => {
			player.isReady = true;
			console.log(`${player.name} is ready!`);
			this.checkLobbyState()
		});
	}

	public removePlayer(playerId: string) {
		this.players = this.players.filter(p => p.id != playerId);

		if (this.currentMatch) {
			console.log(`Player ${playerId} has left during a match.`);
			this.currentMatch.forceEnd(playerId);
			this.currentMatch = null;
		}

		if (this.players.length > 0) {
			this.players[0].emit(PacketType.LobbyState, { state: LobbyState.WaitingForOpp } );
			this.players[0].isReady = false;
			this.isOpen = true;
		}
	}

	public hasPlayer(id: string) { return this.players.find(p => p.id == id) != null }
	public isEmpty() { return this.players.length == 0; }
}
