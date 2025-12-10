import { EventEmitter } from "../event_emitter";
import { createPiece, resetPiece, Piece, getPieceBounds, getRotatedPiece } from "../piece";
import { Board } from "./board";
import { GameTimer } from "./game_timer";
import { HoldContainer } from "./hold_container";
import { PieceQueue } from "./piece_queue";

export interface GameSettings {
	blockSize: number;
	gravity: number;
	boardWidth: number;
	boardHeight: number;
	lockDelay: number;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
	blockSize: 32,
	gravity: 1,
	boardWidth: 10,
	boardHeight: 20,
	lockDelay: .5,
}

export interface GameEvents {
	"start": void,
	"gameOver": void,

	"move": number,
	"rotate": number,

	"hardDrop": void,
	"softDrop": void,

	"lock": void,
	"lineClear": number,

	"hold": void,
}

export class Game {
	public settings: GameSettings;

	public events: EventEmitter<GameEvents>;

	public board: Board;
	public queue: PieceQueue;
	public hold: HoldContainer;
	public timer: GameTimer;

	public currentPiece: Piece | null = null;

	private lockTimer: number = 0;
	private gravityTimer: number = 0;
	public gravityMult: number = 1;

	public gameOver: boolean = false;

	constructor(settings: GameSettings = DEFAULT_GAME_SETTINGS) {
		this.settings = settings;

		this.events = new EventEmitter<GameEvents>();

		this.board = new Board(settings.boardWidth, settings.boardHeight);
		this.queue = new PieceQueue();
		this.hold = new HoldContainer();
		this.timer = new GameTimer();

		this.reset();
	}

	reset() {
		this.queue.reset();
		this.hold.reset();
		this.timer.reset();
		this.board.reset();

		this.lockTimer = 0;
		this.gravityTimer = 0;
		this.gravityMult = 1;
		this.gameOver = false;

		this.currentPiece = null;
	}

	start() {
		this.currentPiece = createPiece(this.queue.getNext());
		this.resetCurrentPiece();
		this.timer.start();
	}

	private resetCurrentPiece() {
		if (!this.currentPiece) return;
		const bounding = getPieceBounds(this.currentPiece.shape);
		this.currentPiece = resetPiece(this.currentPiece);
		this.currentPiece.x = Math.floor((this.settings.boardWidth-bounding.width)/2);
		this.currentPiece.y = 0;
	}

	private endTurn() {
		if (!this.currentPiece) return;

		this.board.lockPiece(this.currentPiece);
		let lines = this.board.checkLineClear();
		if (lines > 0) this.events.emit("lineClear", lines);

		this.hold.unlock();
		this.lockTimer = 0;
		this.gravityTimer = 0;

		this.currentPiece = createPiece(this.queue.getNext());
		this.resetCurrentPiece();
	}

	private canMove(dx: number, dy: number): boolean {
		if (!this.currentPiece) return false;
		return this.board.isValidPosition(this.currentPiece.shape, this.currentPiece.x+dx, this.currentPiece.y+dy);
	}

	public getLowestPosition(): number {
		if (!this.currentPiece) return 0;
		let testedY = 0;
		while (this.canMove(0, testedY)) testedY++;
		return testedY + this.currentPiece.y - 1;
	}

	public swapHold() {
		if (this.hold.isLocked || !this.currentPiece || this.gameOver) return;

		this.currentPiece = this.hold.swap(resetPiece(this.currentPiece));

		if (!this.currentPiece) this.currentPiece = createPiece(this.queue.getNext());
		this.resetCurrentPiece();

		this.events.emit("hold", undefined);
	}

	public hardDrop() {
		if (!this.currentPiece || this.gameOver) return;
		const lowestY = this.getLowestPosition();
		this.currentPiece.y = lowestY;
		this.events.emit("hardDrop", undefined);
		this.events.emit("lock", undefined);
		this.endTurn();
	}

	public movePiece(dir: -1 | 1): boolean {
		if (!this.currentPiece || this.gameOver) return false;
		if (!this.canMove(dir, 0)) return false;
		this.currentPiece.x += dir;
		this.lockTimer = 0;

		this.events.emit("move", dir);
		return true;
	}

	public rotatePiece(dir: -1 | 1): boolean {
		if (!this.currentPiece || this.gameOver) return false;

		const candidate = getRotatedPiece(this.currentPiece, dir);

		const kicks = [
			{x:0,  y:0},
			{x:1,  y:0},
			{x:-1, y:0},
			{x:0,  y:-1},
			{x:1,  y:-1},
			{x:-1, y:-1},
		];

		for (const offset of kicks) {
			if (!this.board.isValidPosition(candidate.shape, candidate.x + offset.x, candidate.y + offset.y)) continue;
			this.currentPiece.shape = candidate.shape;
			this.currentPiece.x += offset.x;
			this.currentPiece.y += offset.y;
			this.lockTimer = 0;
			this.events.emit("rotate", dir);
			return true;
		}
		return false;
	}

	public updateGravity(dt: number) {
		if (!this.currentPiece) return;
		const interval = this.settings.gravity / this.gravityMult;
		this.gravityTimer += dt;

		while (this.gravityTimer >= interval) {
			if (!this.canMove(0, 1)) { this.gravityTimer = 0; break; }
			if (this.gravityMult != 1) this.events.emit("softDrop", undefined);
			this.currentPiece.y++;
			this.lockTimer = 0;

			if (interval == 0) this.gravityTimer = 0;
			else this.gravityTimer -= interval;
		}
	}

	public updateLock(dt: number) {
		if (this.canMove(0, 1)) { this.lockTimer = 0; return; }
		this.lockTimer += dt;
		if (this.lockTimer < this.settings.lockDelay) return;
		this.events.emit("lock", undefined);
		this.endTurn();
	}

	public update(dt: number) {
		if (!this.currentPiece || this.gameOver) return;

		this.timer.update(dt);
		this.updateGravity(dt);
		this.updateLock(dt);
	}
}
