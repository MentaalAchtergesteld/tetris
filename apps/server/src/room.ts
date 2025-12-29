import { PacketType } from "@tetris/core";
import { Player, ServerMatch } from "./server_match.js";

export class Room {
	public id: string;
	private players: Player[] = [];
	private points: Map<string, number>;

	private currentMatch: ServerMatch | null = null;

	constructor() {
		this.id = `room_${Date.now().toFixed(4)}`;
		this.points = new Map();
	}

	public isOpen(): boolean {
		return this.currentMatch == null && this.players.length < 2;
	}

	public isEmpty(): boolean {
		return this.players.length == 0;
	}

	public hasPlayer(id: string): boolean {
		return this.players.some(p => p.id == id);
	}

	public addPlayer(player: Player): boolean {
		if (!this.isOpen()) return false;
		if (this.hasPlayer(player.id)) return true;

		this.players.forEach(p => p.emit(PacketType.PlayerJoined, { playerId: player.id }));

		this.players.push(player);
		this.points.set(player.id, 0);
		player.emit(PacketType.JoinRoom, null);

		console.log(`${player.name} has joined room ${this.id}.`);

		this.checkRoomState();

		return true;
	}

	public removePlayer(id: string) {
		const player = this.players.find(p => p.id == id);
		if (!player) return;
		this.players = this.players.filter(p => p.id);
		this.players.forEach(p => p.emit(PacketType.PlayerLeft, { playerId: id }));
		console.log(`${player.name} has left room ${this.id}.`);
	}

	private onMatchEnd(winnerId: string) {
		this.currentMatch = null;

		const currentWinnerPoints = this.points.get(winnerId) || 0;
		this.points.set(winnerId, currentWinnerPoints+1);

		const pointsEntries = Array.from(this.points.entries());
		const { id, maxPoints} = pointsEntries.reduce(
			(acc, [id, points]) => {
				if (points > acc.maxPoints) {
					return { id, maxPoints: points };
				} else {
					return acc;
				}
			},
			{ id: "", maxPoints: 0}
		);

		if (maxPoints < 3) { this.checkRoomState(); return };

		this.players.forEach(p => {
			const points = this.points.get(p.id) || 0;
			const opponentPoints = new Map(pointsEntries.filter(([id, _]) => id != p.id));

			const packet = {
				winnerId: id,
				selfPoints: points,
				opponentPoints
			};

			p.emit(PacketType.FinishMatch, packet);

			p.once(PacketType.LeaveRoom, () => this.players = this.players.filter((_p) => _p.id != p.id));
		});
	}

	private startMatch() {
		console.log(`room ${this.id} filled, starting match.`);
		this.currentMatch = new ServerMatch(this.players);
		this.currentMatch.events.once("matchEnd", (winnerId) => this.onMatchEnd(winnerId));
	}

	private checkRoomState() {
		if (this.players.length < 2) return;
		this.startMatch();
	}
}
