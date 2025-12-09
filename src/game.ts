import { Board } from "./board.ts";
import { EventEmitter } from "./event_emitter.ts";
import { MAX_PIECE_BOUNDS, Piece, TETROMINOS, TetrominoType, createPiece, createPieceBag, drawPieceCentered, drawPieceShape, getRotatedPiece } from "./piece";
import { GameSettings, DEFAULT_GAME_SETTINGS } from "./settings.ts";
import { ColorTheme } from "./theme.ts";
import { drawLabel, getTextHeight } from "./visuals.ts";

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
	settings: GameSettings;

	public events = new EventEmitter<GameEvents>();

	private board: Board;

	private currentPiece: Piece | null = null;
	private lockTimer: number = 0;
	private gravityTimer: number = 0;
	gravityFactor: number = 1;

	private holdPiece: Piece | null = null;
	private hasSwappedHold: boolean = false;

	private pieceQueue: TetrominoType[] = [];
	private readonly PREVIEW_COUNT = 5;

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
		let lines = this.board.checkLineClear();
		if (lines > 0) this.events.emit("lineClear", lines);

		this.hasSwappedHold = false;
		this.lockTimer = 0;
		this.gravityTimer = 0;

		this.nextPiece();
	}

	private refillQueue() {
		while (this.pieceQueue.length <= this.PREVIEW_COUNT + 7) {
			this.pieceQueue.push(...createPieceBag());
		}
	}

	reset() {
		this.pieceQueue = [];
		this.holdPiece = null;
		this.currentPiece = null;
		this.board.initializeGrid();
		this.refillQueue();
		this.nextPiece();
		this.gameOver = false;
		this.events.emit("start", undefined);
	}

	resetPieceState(piece: Piece) {
		piece.shape = TETROMINOS[piece.type].map((row: readonly number[])=> [...row]),
		piece.x = Math.floor(this.board.width / 2 - piece.shape.length / 2);
		piece.y = 0;
	}

	nextPiece() {
		this.refillQueue();
		this.currentPiece = createPiece(this.pieceQueue.shift() as TetrominoType);
		this.resetPieceState(this.currentPiece);

		if (!this.canMove(0, 0)) {
			this.gameOver = true;
			this.events.emit("gameOver", undefined);
		}
	}

	swapHold() {
		if (this.hasSwappedHold || this.gameOver || !this.currentPiece) return;

		const pieceToHold = this.currentPiece;
		const pieceFromHold = this.holdPiece;

		this.currentPiece = pieceFromHold;
		this.holdPiece = pieceToHold;

		this.hasSwappedHold = true;

		this.resetPieceState(this.holdPiece);

		if (this.currentPiece) this.resetPieceState(this.currentPiece)
			else this.nextPiece();

		this.lockTimer = 0;
		this.gravityTimer = 0;
		this.events.emit("hold", undefined);
	}

	movePiece(dir: -1 | 1): boolean {
		if (!this.currentPiece || this.gameOver) return false;
		if (!this.canMove(dir, 0)) return false;
		this.currentPiece.x += dir;
		this.lockTimer = 0;

		this.events.emit("move", dir);
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
			this.events.emit("rotate", dir);
			return true;
		}
		return false;
	}

	hardDropPiece() {
		if (!this.currentPiece || this.gameOver) return;
		let testedY = 0;
		while (this.canMove(0, testedY)) testedY++;
		this.currentPiece.y += testedY-1;
		this.events.emit("hardDrop", undefined);
		this.events.emit("lock", undefined);
		this.endTurn();
	}

	handleGravity(dt: number) {
		if (!this.currentPiece) return;
		const interval = this.settings.gravity / this.gravityFactor;
		this.gravityTimer += dt;

		while (this.gravityTimer >= interval) {
			if (!this.canMove(0, 1)) { this.gravityTimer = 0; break; }
			if (this.gravityFactor != 1) this.events.emit("softDrop", undefined);
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
		this.events.emit("lock", undefined);
		this.endTurn();
	}

	update(dt: number) {
		if (!this.currentPiece || this.gameOver) return;

		this.handleGravity(dt);
		this.handleLock(dt);
	}

	drawHoldPiece(theme: ColorTheme, ctx: CanvasRenderingContext2D) {
		const width = (MAX_PIECE_BOUNDS.width+.5)*this.settings.blockSize;
		const height = (MAX_PIECE_BOUNDS.height+1)*this.settings.blockSize;

		const gap = this.settings.blockSize*0.5;


		const labelText = "hold";
		const textHeight = getTextHeight(labelText, 32, "Audiowide", ctx);

		const x = -(width+gap);
		let y = textHeight;

		drawLabel(labelText, x, y, 32, "Audiowide", theme.BoardBorder, ctx);

		y += 8;

		ctx.fillStyle = theme.BoardBackground;
		ctx.fillRect(x, y, width, height);

		const borderWidth = 4;
		const offset = borderWidth/2;

		ctx.strokeStyle = theme.BoardBorder;
		ctx.lineWidth = borderWidth;

		ctx.strokeRect(x-offset,y-offset, width+borderWidth,height+borderWidth);

		if (!this.holdPiece) return;

		drawPieceCentered(
			this.holdPiece.shape,
			x, y,
			width, height,
			this.settings.blockSize,
			theme, ctx
		);
	}

	drawPieceQueue(theme: ColorTheme, ctx: CanvasRenderingContext2D) {
		const entryHeight = (MAX_PIECE_BOUNDS.height+.5)*this.settings.blockSize;

		const height = entryHeight * this.PREVIEW_COUNT;
		const width = (MAX_PIECE_BOUNDS.width+.5)*this.settings.blockSize;

		const labelText = "queue";
		const textHeight = getTextHeight(labelText, 32, "Audiowide", ctx);

		const x = (this.board.width+1) * this.settings.blockSize;
		let y = textHeight;

		drawLabel(labelText, x, y, 32, "Audiowide", theme.BoardBorder, ctx);

		y += 8;

		ctx.fillStyle = theme.BoardBackground;
		ctx.fillRect(x, y, width, height);

		const borderWidth = 4;
		const offset = borderWidth/2;

		ctx.strokeStyle = theme.BoardBorder;
		ctx.lineWidth = borderWidth;

		ctx.strokeRect(x-offset,y-offset, width+borderWidth,height+borderWidth);

		for (let i = 0; i < this.PREVIEW_COUNT; i++) {
			drawPieceCentered(
				TETROMINOS[this.pieceQueue[i]],
				x, y+entryHeight*i,
				width, entryHeight,
				this.settings.blockSize,
				theme, ctx
			);
		}
	}

	drawDropPreview(theme: ColorTheme, ctx: CanvasRenderingContext2D) {
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
			theme,
			ctx
		);
	}

	draw(theme: ColorTheme, ctx: CanvasRenderingContext2D) {
		const totalWidth = this.board.width * this.settings.blockSize;
		const totalHeight = this.board.height * this.settings.blockSize;

		ctx.translate(-totalWidth/2, -totalHeight/2);

		this.drawPieceQueue(theme, ctx);
		this.drawHoldPiece(theme, ctx);
		this.board.draw(this.settings.blockSize, theme, ctx);
		if (this.currentPiece) drawPieceShape(
			this.currentPiece.shape,
			this.currentPiece.x*this.settings.blockSize,
			this.currentPiece.y*this.settings.blockSize,
			this.settings.blockSize,
			false,
			theme,
			ctx
		);
		this.drawDropPreview(theme, ctx);
	}
}
