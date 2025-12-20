import { C2SEvents, PacketType, S2CEvents } from "@tetris/shared";
import { Game, GameAction, EventEmitter } from "@tetris/shared";
import { Socket } from "socket.io";

export class Player {
	public id: string;
	public name: string;
	private socket: Socket;

	public isReady: boolean = false;

	constructor(socket: Socket<C2SEvents, S2CEvents>) {
		this.socket = socket;
		this.id = socket.id;

		this.name = `Guest_${this.id.substring(0, 4)}`;
	}

	public emit<T extends keyof S2CEvents>(event: T, ...args: Parameters<S2CEvents[T]>) {
		this.socket.emit(event, ...args);
	}

	public on<T extends keyof C2SEvents>(event: T, callback: C2SEvents[T]) {
		this.socket.on(event, callback as any);
	}

	public once<T extends keyof C2SEvents>(event: T, callback: C2SEvents[T]) {
		this.socket.once(event, callback as any);
	}

	public off<T extends keyof C2SEvents>(event: T, callback: C2SEvents[T]) {
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
	private seed: number;

	private loopId: NodeJS.Timeout | null = null;;

	private ticksCount = 0;

	public events: EventEmitter<ServerMatchEvent>;

	constructor(players: Player[]) {
		this.games = new Map();
		this.players = new Map();
		this.events = new EventEmitter();
		this.seed = Date.now();

		players.forEach((p) => this.addPlayer(p));
	}

	private checkAllReady() {
		const allReady = Array.from(this.players.values()).every(p => p.isReady);
		if (allReady) this.startMatch();
	}

	private onPlayerAction(id: string, action: GameAction, data: number) {
		const game = this.games.get(id);
		if (!game) return;
		
		if (action == GameAction.SoftDrop) {
			game.softDropFactor = data;
		} else {
			game.softDropFactor = 1;
			game.handleInput(action);
		}

		this.players.forEach(p => { if (p.id != id) p.emit(PacketType.Action, { action, data }) });
	}

	private calculateGarbage(linesCleared: number): number {
		switch (linesCleared) {
			case 2: return 1;
			case 3: return 2;
			case 4: return 4;
			default: return 0; 
		}
	}

	private onLineClear(id: string, count: number) {
		const garbage = this.calculateGarbage(count);
		if (garbage <= 0) return;

		const player = this.players.get(id);

		this.players.forEach(p => {
			if (p.id == id) return;

			const packet = {
				receiverId: p.id,
				senderId: id,
				amount: garbage,
			};
			if (player) player.emit(PacketType.GarbageOut, packet);
			p.emit(PacketType.GarbageIn, packet);
		});
	}

	private onGameOver(id: string) {
		const winnerId = Array.from(this.players.values()).find(p => p.id != id)!.id;
		this.stopMatch(winnerId);
		this.players.forEach(p => p.emit(PacketType.EndMatch, { winnerId }));
	}

	private addPlayer(player: Player) {
		const game = new Game();
		game.setSeed(this.seed);
		this.games.set(player.id, game);
		this.players.set(player.id, player);

		game.events.on("lineClear", (count) => this.onLineClear(player.id, count));
		game.events.on("gameOver",  () => this.onGameOver(player.id));

		player.on(PacketType.Ready,  () => { player.isReady = true; this.checkAllReady() });
		player.on(PacketType.Action, ({ action, data }) => this.onPlayerAction(player.id, action, data));

		player.emit(PacketType.Seed, { seed: this.seed });
	}

	private stopMatch(winnerId: string) {
		this.events.emit("matchEnd", winnerId);

		if (this.loopId) clearInterval(this.loopId);
	}

	private lastTickTime: number = 0;

	private startMatch() {
		this.games.forEach(g => g.start());
		this.players.forEach(p => p.emit(PacketType.StartMatch, null));
		this.loopId = setInterval(() => this.loop(), this.tickRate);
	}

	private loop() {
		const now = Date.now();
		let dt = (now - this.lastTickTime) / 1000;
		this.lastTickTime = now;

		if (dt > 0.1) dt = 0.1;

		this.games.forEach((game, id) => {
			game.update(dt);
			const player = this.players.get(id);
			
			if (this.ticksCount % 5 != 0) return;

			const state = {
				id,
				grid: game.getGrid(),
				currentPiece: game.getCurrentPiece(),
			};

			player?.emit(PacketType.SelfState, state);
			this.players.forEach(p => { if (p.id != id) p.emit(PacketType.OppState, state) });
		});
	}
}
