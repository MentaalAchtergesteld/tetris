import { Board } from "./board.ts";
import { Piece, TETROMINOS, TetrominoType, createPiece, createPieceBag, drawPieceShape, getRotatedPiece } from "./piece";
import { GameSettings, DEFAULT_GAME_SETTINGS } from "./settings.ts";

export class Game {
	settings: GameSettings;

	private board: Board;

	private currentPiece: Piece | null = null;
	private lockTimer: number = 0;
	private gravityTimer: number = 0;
	gravityFactor: number = 1;

	private holdPiece: Piece | null = null;
	private hasSwappedHold: boolean = false;

	private pieceBag: TetrominoType[] = [];

	gameOver = false;

	constructor(settings: GameSettings = DEFAULT_GAME_SETTINGS) {
		this.settings = settings;
		this.board = new Board(settings.boardWidth, settings.boardHeight);
		this.reset();
	}

	private isValidPosition(shape: number[][], nx: number, ny: number): boolean {
		if (!this.currentPiece) return false;
		for (let y = 0; y < shape.length; y++) {
			for (let x = 0; x < shape.length; x++) {
				if (shape[y][x] == 0) continue;
				const targetX = nx+x;
				const targetY = ny+y;

				if (!this.board.isEmpty(targetX, targetY)) return false;
			}
		}
		return true;
	}

	private canMove(dx: number, dy: number): boolean {
		if (!this.currentPiece) return false;
		return this.isValidPosition(
			this.currentPiece.shape,
			this.currentPiece.x+dx,
			this.currentPiece.y+dy
		);
	}

	private endTurn() {
		if (!this.currentPiece) return;

		this.board.lockPiece(this.currentPiece);
		this.board.checkLineClear();

		this.hasSwappedHold = false;
		this.lockTimer = 0;
		this.gravityTimer = 0;

		this.nextPiece();
	}

	private fillPieceBag() {
		this.pieceBag = createPieceBag();
	}

	reset() {
		this.fillPieceBag();
		this.nextPiece();
		this.board.initializeGrid();
	}

	resetPieceState(piece: Piece) {
		piece.shape = TETROMINOS[piece.type].map((row: readonly number[])=> [...row]),
		piece.x = Math.floor(this.board.width / 2 - piece.shape.length / 2);
		piece.y = 0;
	}

	nextPiece() {
		if (this.pieceBag.length == 0) this.fillPieceBag();
		this.currentPiece = createPiece(this.pieceBag.pop() as TetrominoType);
		this.currentPiece.x = Math.floor(this.board.width/2 - this.currentPiece.shape.length/2);

		if (!this.canMove(0, 0)) this.gameOver = true;
	}

	swapHold() {
		if (this.hasSwappedHold || this.gameOver) return;
		const current = this.currentPiece;
		this.currentPiece = this.holdPiece;
		this.holdPiece = current;

		this.hasSwappedHold = true;

		if (this.currentPiece) this.resetPieceState(this.currentPiece)
		else this.nextPiece();

		this.lockTimer = 0;
		this.gravityTimer = 0;
	}

	movePiece(dir: -1 | 1): boolean {
		if (!this.currentPiece || this.gameOver) return false;
		if (!this.canMove(dir, 0)) return false;
		this.currentPiece.x += dir;
		this.lockTimer = 0;
		return true;
	}

	rotatePiece(dir: -1 | 1): boolean {
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
			if (!this.isValidPosition(candidate.shape, candidate.x + offset.x, candidate.y + offset.y)) continue;
			this.currentPiece.shape = candidate.shape;
			this.currentPiece.x += offset.x;
			this.currentPiece.y += offset.y;
			this.lockTimer = 0;
			return true;
		}
		return false;
	}

	lockPiece() {
		if (!this.currentPiece) return;
		this.lockTimer = 0;
		this.board.lockPiece(this.currentPiece);
	}

	hardDropPiece() {
		if (!this.currentPiece || this.gameOver) return;
		let testedY = 0;
		while (this.canMove(0, testedY)) testedY++;
		this.currentPiece.y += testedY-1;
		this.endTurn();
	}

	handleGravity(dt: number) {
		if (!this.currentPiece) return;
		const interval = this.settings.gravity / this.gravityFactor;
		this.gravityTimer += dt;

		while (this.gravityTimer >= interval) {
			if (!this.canMove(0, 1)) { this.gravityTimer = 0; break; }
			this.currentPiece.y++;
			this.lockTimer = 0;

			if (interval == 0) this.gravityTimer = 0;
			else this.gravityTimer -= interval;
		}
	}

	handleLock(dt: number) {
		if (this.canMove(0, 1)) { this.lockTimer = 0; return; }
		this.lockTimer += dt;
		if (this.lockTimer < this.settings.lockDelay) return;
		this.endTurn();
	}

	update(dt: number) {
		if (!this.currentPiece || this.gameOver) return;

		this.handleGravity(dt);
		this.handleLock(dt);
	}

	drawHoldPiece(ctx: CanvasRenderingContext2D) {
		if (!this.holdPiece) return;
		let xOffset = -this.settings.blockSize*4.5;
		drawPieceShape(this.holdPiece.shape, xOffset, 0, this.settings.blockSize, false, ctx);
	}

	drawDropPreview(ctx: CanvasRenderingContext2D) {
		if (!this.currentPiece) return;
		let lowestY = 0;
		while (this.canMove(0, lowestY)) lowestY++;
		lowestY += this.currentPiece.y-1;
		drawPieceShape(
			this.currentPiece.shape,
			this.currentPiece.x*this.settings.blockSize,
			lowestY*this.settings.blockSize,
			this.settings.blockSize,
			true,
			ctx
		);
	}

	draw(ctx: CanvasRenderingContext2D) {
		const totalWidth = this.board.width * this.settings.blockSize;
		const totalHeight = this.board.height * this.settings.blockSize;

		ctx.translate(-totalWidth/2, -totalHeight/2);

		this.board.draw(this.settings.blockSize, ctx);
		if (this.currentPiece) drawPieceShape(
			this.currentPiece.shape,
			this.currentPiece.x*this.settings.blockSize,
			this.currentPiece.y*this.settings.blockSize,
			this.settings.blockSize,
			false,
			ctx
		);
		this.drawHoldPiece(ctx);
		this.drawDropPreview(ctx);
	}
}
