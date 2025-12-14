import { Game, GameAction, RNG, EventEmitter } from "@tetris/shared";
import { Socket } from "socket.io";

export class Player {
	public id: string;
	public name: string;
	private socket: Socket;

	public isReady: boolean = false;

	constructor(socket: Socket) {
		this.socket = socket;
		this.id = socket.id;

		this.name = `Guest_ ${this.id.substring(0, 4)}`;
	}

	public emit(event: string, data?: any) {
		this.socket.emit(event, data);
	}

	public on(event: string, callback: (data: any) => void) {
		this.socket.on(event, callback);
	}

	public disconnect() {
		this.socket.disconnect();
	}
}

export interface ServerMatchEvent {
	"matchEnd": string,
}

export class ServerMatch {
	private games: Map<string, Game>;
	private players: Map<string, Player>;
	private tickRate = 1000 / 60;

	private loopId: NodeJS.Timeout | null = null;;

	private ticksCount = 0;

	public events: EventEmitter<ServerMatchEvent>;

	constructor(players: Player[]) {
		this.games = new Map();
		this.players = new Map();

		this.events = new EventEmitter();

		const seed = Date.now();
		players.forEach(p => {
			this.players.set(p.id, p);
			const game = new Game(new RNG(seed));
			this.games.set(p.id, game);
		});

		this.setupGameEvents();
		this.startLoop();
	}

	private calculateGarbage(lines: number) { 
		switch(lines) {
			case 2: return 1;
			case 3: return 2;
			case 4: return 4;
			default: return 0;
		}
	}

	public forceEnd(leaverId: string) {
		if (this.loopId) clearInterval(this.loopId);

		this.players.forEach(p => {
			if (p.id != leaverId) p.emit("match_end", {
				winner: true,
				reason: "opponent_disconnected"
			});
		});
	}

	private endMatch(loserId: string) {
		if (this.loopId) clearInterval(this.loopId);

		let winnerId = "";
		this.players.forEach((_, id) => { if (id != loserId) winnerId = id });

		this.players.forEach(p => p.emit("match_end",{ winner: p.id == winnerId }));

		this.events.emit("matchEnd", winnerId);
	}

	private setupGameEvents() {
		this.games.forEach((game, playerId) => {
			const player = this.players.get(playerId);

			game.events.on("lineClear", (lines: number) => {
				const garbageAmount = this.calculateGarbage(lines);
				if (garbageAmount == 0) return;

				this.games.forEach((oppGame, oppId) => {
					if (oppId == playerId) return;
					oppGame.addGarbage(garbageAmount);
					const oppPlayer = this.players.get(oppId);
					oppPlayer?.emit("garbage_received", garbageAmount);
					player?.emit("garbage_sent", garbageAmount);
				});
			});

			game.events.on("gameOver", () => {
				this.endMatch(playerId);
			});
		});
	}

	private broadcastState() {
		this.players.forEach((player, id) => {
			const game = this.games.get(id)!;

			player.emit("self_state", {
				grid: game.getGrid(),
				piece: game.getCurrentPiece(),
			})

			this.games.forEach((otherGame, otherId) => {
				if (otherId == id) return;
				player.emit("opponent_state", {
					grid: otherGame.getGrid(),
					piece: otherGame.getCurrentPiece(),
				});
			});
		});
	}

	private tick() {
		this.games.forEach((game) => {
			game.update(this.tickRate/1000);
		});

		if (this.ticksCount % 5 == 0) this.broadcastState();
		this.ticksCount++;
	}

	private startLoop() {
		this.loopId = setInterval(() => {
			this.tick();
		}, this.tickRate);
	}

	public onPlayerAction(playerId: string, action: GameAction) {}
}
