import { PacketType } from "@tetris/shared";
import { Server2ClientEvents } from "@tetris/shared";
import { Client2ServerEvents } from "@tetris/shared";
import { Game, GameAction, RNG, EventEmitter } from "@tetris/shared";
import { Socket } from "socket.io";

export class Player {
	public id: string;
	public name: string;
	private socket: Socket;

	public isReady: boolean = false;

	constructor(socket: Socket<Client2ServerEvents,Server2ClientEvents>) {
		this.socket = socket;
		this.id = socket.id;

		this.name = `Guest_ ${this.id.substring(0, 4)}`;
	}

	public emit<T extends keyof Server2ClientEvents>(event: T, ...args: Parameters<Server2ClientEvents[T]>) {
		this.socket.emit(event, ...args);
	}

	public on<T extends keyof Client2ServerEvents>(event: T, callback: Client2ServerEvents[T]) {
		this.socket.on(event, callback as any);
	}
	
	public off<T extends keyof Client2ServerEvents>(event: T, callback: Client2ServerEvents[T]) {
		this.socket.off(event, callback as any);
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
			if (p.id != leaverId) p.emit(PacketType.MatchEnd, {
				winnerId: p.id,
				reason: "opponent_disconnected"
			});
		});
	}

	private endMatch(loserId: string) {
		if (this.loopId) clearInterval(this.loopId);

		let winnerId = "";
		this.players.forEach((_, id) => { if (id != loserId) winnerId = id });

		this.players.forEach(p => p.emit(PacketType.MatchEnd, { winnerId }));

		this.events.emit("matchEnd", winnerId);
	}

	private setupGameEvents() {
		this.games.forEach((game, playerId) => {
			const player = this.players.get(playerId);

			game.events.on("lineClear", (lines: number) => {
				const amount = this.calculateGarbage(lines);
				if (amount == 0) return;

				this.games.forEach((oppGame, oppId) => {
					if (oppId == playerId) return;
					oppGame.addGarbage(amount);
					const oppPlayer = this.players.get(oppId);
					oppPlayer?.emit(PacketType.GarbageIn, { amount });
					player?.emit(PacketType.GarbageOut, { amount });
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

			player.emit(PacketType.SelfState, {
				grid: game.getGrid(),
				currentPiece: game.getCurrentPiece(),
			})

			this.games.forEach((otherGame, otherId) => {
				if (otherId == id) return;
				player.emit(PacketType.OppState, {
					grid: otherGame.getGrid(),
					currentPiece: otherGame.getCurrentPiece(),
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
