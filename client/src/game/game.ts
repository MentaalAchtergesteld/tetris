import { Board } from "../game/board";
import { getRotatedPiece, getSRSOffsets, Piece } from "../game/piece";
import { HoldContainer } from "../game/hold_container";
import { PieceQueue } from "../game/piece_queue";
import { EventEmitter } from "../engine/events";
import { TetrominoType } from "./piece";
import { GameAction } from "../engine/input/input_manager";
import { RNG } from "../engine/rng";

export interface GameSettings {
	gravity: number;
	boardWidth: number;
	boardHeight: number;
	lockDelay: number;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
	gravity: 2,
	boardWidth: 10,
	boardHeight: 20,
	lockDelay: .5,
}

export interface GameEvents {
	"start": void,
	"gameOver": void,
	"reset": void,

	"move": number,
	"drop": number,
	"rotate": number,

	"hardDrop": void,

	"lock": void,
	"lineClear": number,

	"hold": void,
	"spawn": void,

	"garbageAdded": number,
}

export class Game {
	public readonly rng: RNG;
	public readonly events: EventEmitter<GameEvents>;

	public currentPiece: Piece | null = null;

	public settings: GameSettings;

	private board: Board;
	private hold: HoldContainer;
	private queue: PieceQueue;

	private lockTimer: number = 0;

	private gravityTimer: number = 0;
	public softDropFactor: number = 0;
	public gravityMultiplier: number = 1;

	public isGameOver: boolean = false;

	constructor(rng: RNG, settings: GameSettings = DEFAULT_GAME_SETTINGS) {
		this.settings = settings

		this.rng = rng;
		this.events = new EventEmitter<GameEvents>();

		this.board = new Board(rng, this.settings.boardWidth, this.settings.boardHeight);
		this.hold = new HoldContainer();
		this.queue = new PieceQueue(rng);

		this.board.reset();
		this.queue.reset();
		this.hold.reset();
	}

	public getGrid(): number[][] { return this.board.grid }
	public getDimensions(): { width: number, height: number } {
		return { width: this.board.width, height: this.board.height }
	}
	public getVisibleHeight(): number { return this.board.visibleHeight }
	public getQueue(count: number): TetrominoType[] { return this.queue.peek(count) }
	public getHoldType(): TetrominoType | null { return this.hold.piece }
	public getCurrentPiece(): Piece | null { return this.currentPiece }
	public getCurrentPieceLowestY(): number {
		if (!this.currentPiece) return 0;
		let yOffset = 0;

		while (this.canMoveCurrentPiece(0, yOffset+1)) yOffset+=1;
		return this.currentPiece.y + yOffset;
	}
	public getOccupiedHeight() { return this.board.getOccupiedHeight(); }

	public handleInput(action: GameAction): boolean {
		console.log(action);
		switch (action) {
			case GameAction.MoveRight: return this.moveCurrentPiece( 1, 0);
			case GameAction.MoveLeft:  return this.moveCurrentPiece(-1, 0);
			case GameAction.HardDrop:  return this.hardDrop();
			case GameAction.Hold:      return this.swapHold();
			case GameAction.RotateCW:  return this.rotateCurrentPiece( 1);
			case GameAction.RotateCCW: return this.rotateCurrentPiece(-1);
			case GameAction.Reset:     {this.reset(); return true;}
			default: return false;
		}
	}

	private spawnNewCurrentPiece(type: TetrominoType) {
		this.currentPiece = Piece.spawn(type);
		this.currentPiece.x = Math.floor((this.board.width - this.currentPiece.shape.length)/2);
		this.currentPiece.y = this.board.visibleHeight-3;

		this.events.emit("spawn", undefined);
	}

	private endTurn() {
		if (!this.currentPiece) return;

		this.board.lockPiece(this.currentPiece);
		this.events.emit("lock", undefined);
		if (this.board.isFullyInBuffer(this.currentPiece)) {
			this.isGameOver = true;
			this.events.emit("gameOver", undefined);
			return;
		}

		let lines = this.board.checkLineClear();
		if (lines > 0) this.events.emit("lineClear", lines);

		this.hold.unlock();
		this.lockTimer = 0;
		this.gravityTimer = 0;

		this.spawnNewCurrentPiece(this.queue.getNext())
	}

	private canMoveCurrentPiece(dx: number, dy: number): boolean {
		if (!this.currentPiece) return false;
		return this.board.isValidPosition(this.currentPiece.shape, this.currentPiece.x+dx, this.currentPiece.y+dy);
	}

	public addGarbage(amount: number, holeIndex?: number): void {
		this.board.addGarbage(amount, holeIndex);
		this.events.emit("garbageAdded", amount);
	}

	public moveCurrentPiece(dx: number, dy: number): boolean {
		if (!this.currentPiece || this.isGameOver) return false;
		if (!this.canMoveCurrentPiece(dx, dy)) return false;

		this.currentPiece.x += dx;
		this.currentPiece.y += dy;
		this.lockTimer = 0;

		if (dx != 0) this.events.emit("move", dx);
		if (dy != 0) this.events.emit("drop", dy);
		return true;
	}

	public rotateCurrentPiece(dir: -1 | 1): boolean {
		if (!this.currentPiece || this.isGameOver) return false;

		const candidate	= getRotatedPiece(this.currentPiece, dir);
		const offsets = getSRSOffsets(this.currentPiece, candidate.rotation);

		for (const offset of offsets) {
			if (!this.board.isValidPosition(
				candidate.shape,
				candidate.x + offset.x,
				candidate.y + offset.y
			)) continue;

			this.currentPiece = candidate;
			this.currentPiece.x += offset.x;
			this.currentPiece.y += offset.y;
			this.lockTimer = 0;
			this.events.emit("rotate", dir);
			return true;
		}
		return false;
	}

	public hardDrop(): boolean {
		if (!this.currentPiece || this.isGameOver) return false;
		const lowestY = this.getCurrentPieceLowestY();
		this.currentPiece.y = lowestY;
		this.events.emit("hardDrop", undefined);
		this.endTurn();
		return true;
	}

	public swapHold(): boolean {
		if (this.hold.isLocked || !this.currentPiece || this.isGameOver) return false;

		const typeFromHold = this.hold.swap(this.currentPiece.type);

		if (typeFromHold) this.spawnNewCurrentPiece(typeFromHold);
		else this.spawnNewCurrentPiece(this.queue.getNext());

		this.lockTimer = 0;
		this.gravityTimer = 0;

		this.events.emit("hold", undefined);
		return true;
	}

	public reset() {
		this.currentPiece = null;

		this.board.reset();
		this.queue.reset();
		this.hold.reset();


		this.lockTimer = 0;

    this.gravityTimer = 0;
	  this.softDropFactor = 1;
		this.gravityMultiplier = 1;

	  this.isGameOver = false;
		this.events.emit("reset", undefined);
	}

	public start() {
		this.reset();
		this.spawnNewCurrentPiece(this.queue.getNext());
		this.events.emit("start", undefined);
	}

	public updateGravity(dt: number) {
		if (!this.currentPiece || this.isGameOver) return;

		let speed = this.settings.gravity * this.gravityMultiplier;

		if (this.softDropFactor > 0) {
			const factor = Math.max(1, this.softDropFactor);
			speed *= factor;
		}

		this.gravityTimer += speed * dt;

		while (this.gravityTimer >= 1.0) {
			this.gravityTimer -= 1.0;
			const moved = this.moveCurrentPiece(0, 1);
			if (!moved) { this.gravityTimer = 0; break; }
		}
	}

	public updateLock(dt: number) {
		if (this.canMoveCurrentPiece(0, 1)) { this.lockTimer = 0; return; }
		this.lockTimer += dt;
		if (this.lockTimer < this.settings.lockDelay) return;
		this.endTurn();
	}

	public update(dt: number) {
		if (!this.currentPiece || this.isGameOver) return;

		this.updateGravity(dt);
		this.updateLock(dt);
	}
}
