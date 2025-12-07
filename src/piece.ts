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
} as const;

export type TetrominoType = keyof typeof TETROMINOS;

export interface Piece {
	x: number;
	y: number;
	type: TetrominoType;
	shape: number[][]
};

export function createPiece(type: TetrominoType): Piece {
	return {
		x: 0,
		y: 0,
		type,
		shape: TETROMINOS[type].map((row: readonly number[])=> [...row]),
	};
}

function rotateMatrix(matrix: number[][], dir: -1 | 1): number[][] {
	const transposed = matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));

	if (dir == 1) {
		return transposed.map(row => row.reverse());
	} else {
		return transposed.reverse();
	}
}

export function getRotatedPiece(piece: Piece, dir: -1 | 1): Piece {
	return {
		...piece,
		shape: rotateMatrix(piece.shape, dir),
	}
}

export const COLORS = [
    null,       // 0 = Leeg
    '#00f0f0',  // 1 = I (Cyaan)
    '#0000f0',  // 2 = J (Blauw)
    '#f0a000',  // 3 = L (Oranje)
    '#f0f000',  // 4 = O (Geel)
    '#00f000',  // 5 = S (Groen)
    '#a000f0',  // 6 = T (Paars)
    '#f00000',  // 7 = Z (Rood)
];

export function drawPieceShape(piece: number[][], x: number, y: number, size: number, isPreview: boolean, ctx: CanvasRenderingContext2D) {
	piece.forEach((row: number[], dy: number) => {
		row.forEach((value: number, dx: number) => {
			if (value == 0) return;
			ctx.fillStyle = isPreview ? "hsla(0, 0%, 15%, 0.5)" : COLORS[value] || "white";
			ctx.fillRect(x + dx*size, y + dy*size, size, size);

			ctx.strokeStyle = "hsla(0, 0%, 5%, 0.5)";
			ctx.lineWidth = 1;
			ctx.strokeRect(x + dx*size, y + dy*size, size, size);
		})
	});
}

function shuffleArray(array: any[]) {
	let currentIndex = array.length;
	while (currentIndex != 0) {
		let randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}
}

export function createPieceBag(): TetrominoType[] {
	let bag = Object.keys(TETROMINOS) as TetrominoType[];
	shuffleArray(bag);
	return bag;
}
