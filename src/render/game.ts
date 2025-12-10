import { Board } from "../game/board";
import { Game } from "../game/game";
import { GameTimer } from "../game/game_timer";
import { HoldContainer } from "../game/hold_container";
import { PieceQueue } from "../game/piece_queue";
import { drawPieceCentered, drawPieceShape, MAX_PIECE_BOUNDS, pieceIndexToColor, TETROMINOS } from "../piece";
import { ColorTheme } from "../theme";
import { drawLabel, getTextHeight } from "../visuals";

function drawBoard(board: Board, blockSize: number, theme: ColorTheme, ctx: CanvasRenderingContext2D) {
	const width = board.width * blockSize;
	const height = board.height * blockSize;

	ctx.fillStyle = theme.BoardBackground;
	ctx.fillRect(0, 0, width, height);

	for (let x = 0; x < board.width; x++) {
		for (let y = 0; y < board.height; y++) {
			ctx.strokeStyle = theme.TileBorder;
			ctx.lineWidth = 2;
			ctx.strokeRect(x*blockSize, y*blockSize, blockSize, blockSize);

			if (board.grid[y][x] == 0) continue;
			const blockColor = pieceIndexToColor(board.grid[y][x], theme);
			ctx.fillStyle = blockColor;
			ctx.fillRect(x*blockSize, y*blockSize, blockSize, blockSize);
		}
	}

	const borderWidth = 4;
	const offset = borderWidth/2;
	ctx.strokeStyle = theme.BoardBorder;
	ctx.lineWidth = borderWidth;
	ctx.beginPath();
	ctx.moveTo(-offset, -borderWidth);
	ctx.lineTo(-offset, height+offset);
	ctx.lineTo(width+offset, height+offset);
	ctx.lineTo(width+offset, -borderWidth);
	ctx.stroke();
}

function drawHoldContainer(container: HoldContainer, blockSize: number, theme: ColorTheme, ctx: CanvasRenderingContext2D) {
	const width = (MAX_PIECE_BOUNDS.width+.5)*blockSize;
	const height = (MAX_PIECE_BOUNDS.height+1)*blockSize;

	const labelText = "hold";
	const textHeight = getTextHeight(labelText, 32, "Audiowide", ctx);

	const x = 0;
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

	if (!container.piece) return;

	drawPieceCentered(
		container.piece.shape,
		x, y,
		width, height,
		blockSize,
		theme, ctx
	);
}

function drawPieceQueue(queue: PieceQueue, blockSize: number, theme: ColorTheme, ctx: CanvasRenderingContext2D) {
	const PREVIEW_COUNT = 5;
	const entryHeight = (MAX_PIECE_BOUNDS.height+.5)*blockSize;

	const height = entryHeight * PREVIEW_COUNT;
	const width = (MAX_PIECE_BOUNDS.width+.5)*blockSize;

	const labelText = "queue";
	const textHeight = getTextHeight(labelText, 32, "Audiowide", ctx);

	const x = 0;
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

	const pieces = queue.peek(PREVIEW_COUNT);

	for (let i = 0; i < PREVIEW_COUNT; i++) {
		drawPieceCentered(
			TETROMINOS[pieces[i]],
			x, y+entryHeight*i,
			width, entryHeight,
			blockSize,
			theme, ctx
		);
	}
}

function drawTimer(timer: GameTimer, theme: ColorTheme, ctx: CanvasRenderingContext2D) {
	const labelText = "time";
	let textHeight = getTextHeight(labelText, 16, "Audiowide", ctx);

	const x = 0;
	let y = textHeight;

	drawLabel(labelText, x, y, 24, "Audiowide", theme.BoardBorder, ctx);

	let timerText = timer.format();
	y += getTextHeight(timerText, 32, "Share Tech Mono", ctx);
	y += 8;
	drawLabel(timer.format(), x, y, 32, "Share Tech Mono", theme.BoardBorder, ctx);
}

export function drawGame(game: Game, theme: ColorTheme, ctx: CanvasRenderingContext2D) {
	const blockSize = game.settings.blockSize;

	const panelGap = 16;
	const panelWidth = (MAX_PIECE_BOUNDS.width+0.5)*blockSize;
	const boardWidth = game.settings.boardWidth * blockSize;
	const boardHeight = game.settings.boardHeight * blockSize;

	const boardX = -boardWidth/2;
	const leftX = boardX - panelGap - panelWidth;
	const rightX = boardWidth/2 + panelGap;

	ctx.save();
	ctx.translate(0, -boardHeight/2);

	// LEFT
	ctx.save();
	ctx.translate(leftX, 0);
	drawHoldContainer(game.hold, blockSize, theme, ctx);
	ctx.translate(0, boardHeight-32);
	drawTimer(game.timer, theme, ctx);
	ctx.restore();

	// BOARD
	ctx.save();
	ctx.translate(boardX, 0);
	drawBoard(game.board, blockSize, theme, ctx);

	const currentPiece = game.currentPiece;
	if (currentPiece) {
		let lowest = game.getLowestPosition();
		drawPieceShape(
			currentPiece.shape,
			currentPiece.x*blockSize,
			lowest*blockSize,
			blockSize,
			true,
			theme,
			ctx
		);
		
		drawPieceShape(
			currentPiece.shape,
			currentPiece.x*blockSize,
			currentPiece.y*blockSize,
			blockSize,
			false,
			theme,
			ctx
		);
	}

	ctx.restore();

	// RIGHT
	ctx.save();
	ctx.translate(rightX, 0);
	drawPieceQueue(game.queue, blockSize, theme, ctx);
	ctx.restore();

	ctx.restore();
}
