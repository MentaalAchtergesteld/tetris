import { Color, ColorTheme } from "./theme";

export const TETROMINOS = {
	I: [
		[0, 0, 0, 0],
		[1, 1, 1, 1],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
	],
	J: [
		[2, 0, 0],
		[2, 2, 2],
		[0, 0, 0],
	],
	L: [
		[0, 0, 3],
		[3, 3, 3],
		[0, 0, 0],
	],
	O: [
		[4, 4],
		[4, 4],
	],
	S: [
		[0, 5, 5],
		[5, 5, 0],
		[0, 0, 0],
	],
	T: [
		[0, 6, 0],
		[6, 6, 6],
		[0, 0, 0],
	],
	Z: [
		[7, 7, 0],
		[0, 7, 7],
		[0, 0, 0],
	]
};

export type TetrominoType = keyof typeof TETROMINOS;

export interface Piece {
	x: number;
	y: number;
	type: TetrominoType;
	shape: number[][]
};

export function createPiece(type: TetrominoType): Piece {
	const shape = TETROMINOS[type].map((row: readonly number[])=> [...row]);
	return { x: 0, y: 0, type, shape };
}

export function getRotatedPiece(piece: Piece, dir: -1 | 1): Piece {
	const matrix = piece.shape;
	const transposed = matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
	
	const rotated = dir === 1 
		? transposed.map(row => row.reverse())
		: transposed.reverse();

	return { ...piece, shape: rotated };
}

export function createPieceBag(): TetrominoType[] {
	const bag = Object.keys(TETROMINOS) as TetrominoType[];
		
	for (let i = bag.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[bag[i], bag[j]] = [bag[j], bag[i]];
	}
	
	return bag;
}

export function pieceIndexToColor(index: number, theme: ColorTheme): Color {
	switch (index) {
		case 1: return theme.PieceI;
		case 2: return theme.PieceJ;
		case 3: return theme.PieceL;
		case 4: return theme.PieceO;
		case 5: return theme.PieceS;
		case 6: return theme.PieceT;
		case 7: return theme.PieceZ;
		default: return "transparent";
	}
}

export function getPieceBounds(shape: number[][]) {
	let minX = shape.length, maxX = -1;
	let minY = shape.length, maxY = -1;

	shape.forEach((row, y) => {
		row.forEach((val, x) => {
			if (val == 0) return;
			if (x < minX) minX = x;
			if (x > maxX) maxX = x;
			if (y < minY) minY = y;
			if (y > maxY) maxY= y;
			
		})
	})

	return {
		x: minX, y: minY,
		width: maxX - minX + 1,
		height: maxY - minY + 1,	
	}
}

export function getMaxPieceBounds() {
	let maxW = 0;
	let maxH = 0;

	(Object.keys(TETROMINOS) as TetrominoType[]).forEach(type => {
		const shape = TETROMINOS[type];
		const bounds = getPieceBounds(shape);

		if (bounds.width > maxW) maxW = bounds.width;
		if (bounds.height > maxH) maxH = bounds.height;
	});

	return {
		width: maxW,
		height: maxH
	}
}

export const MAX_PIECE_BOUNDS = getMaxPieceBounds();

export function drawPieceShape(
	piece: number[][],
	x: number,
	y: number,
	size: number,
	isPreview: boolean,
	theme: ColorTheme,
	ctx: CanvasRenderingContext2D
) {
	piece.forEach((row: number[], dy: number) => {
		row.forEach((value: number, dx: number) => {
			if (value == 0) return;
			ctx.fillStyle = isPreview ? theme.PiecePreview : pieceIndexToColor(value, theme);
			ctx.fillRect(x + dx*size, y + dy*size, size, size);

			ctx.strokeStyle = theme.PieceBorder;
			ctx.lineWidth = 1;
			ctx.strokeRect(x + dx*size, y + dy*size, size, size);
		})
	});
}

export function drawPieceCentered(
	shape: number[][],
	bx: number, by: number, bw: number, bh: number,
	size: number,
	theme: ColorTheme,
	ctx: CanvasRenderingContext2D
) {
	const bounds = getPieceBounds(shape);
	const pixelW = bounds.width * size;
	const pixelH = bounds.height * size;

	const startX = bx + (bw - pixelW) / 2 - (bounds.x * size);
	const startY = by + (bh - pixelH) / 2 - (bounds.y * size);

	shape.forEach((row, dy) => {
		row.forEach((val, dx) => {
			if (val == 0) return;

			const px = startX + dx * size;
			const py = startY + dy * size;

			const color = pieceIndexToColor(val, theme);
			ctx.fillStyle = color;
			ctx.fillRect(px, py, size, size);

			ctx.strokeStyle = theme.PieceBorder;
			ctx.lineWidth = 1;
			ctx.strokeRect(px, py, size, size);
		})
	})
}
