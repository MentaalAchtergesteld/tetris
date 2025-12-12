import { GameTheme } from "../theme";

export type TetrominoType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";
export enum Rotation { North, East, South, West };
export const SHAPES: Record<TetrominoType, number[][]> = {
	I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
	J: [[2,0,0],[2,2,2],[0,0,0]],
	L: [[0,0,3],[3,3,3],[0,0,0]],
	O: [[4,4],[4,4]],
	S: [[0,5,5],[5,5,0],[0,0,0]],
	T: [[0,6,0],[6,6,6],[0,0,0]],
	Z: [[7,7,0],[0,7,7],[0,0,0]]
};

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

	(Object.keys(SHAPES) as TetrominoType[]).forEach(type => {
		const shape = SHAPES[type];
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

export class Piece {
	constructor(
		public type: TetrominoType,
		public shape: number[][],
		public x: number = 0,
		public y: number = 0,
		public rotation: Rotation = Rotation.North,
	) {}

	static spawn(type: TetrominoType, x: number = 0, y: number = 0, rotation: Rotation = Rotation.North): Piece {
		const shape = SHAPES[type];
		return new Piece(type, shape, x, y, rotation)
	}

	clone(): Piece {
		return new Piece(this.type, this.shape, this.x, this.y, this.rotation);
	}
}

export function getRotatedPiece(piece: Piece, dir: -1 | 1): Piece {
	const matrix = piece.shape;
	const transposed = matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
	
	const rotated = dir == 1 
		? transposed.map(row => row.reverse())
		: transposed.reverse();

	const newRot = (piece.rotation + dir + 4) % 4;
	return new Piece(piece.type, rotated, piece.x, piece.y, newRot);
}

// J, L, S, T, Z Offset Data
// Matches the table in "How Guideline SRS Really Works"
const SRS_OFFSETS_JLSTZ = [
    // 0 - North
    [{x:0, y:0}, {x:0, y:0}, {x:0, y:0}, {x:0, y:0}, {x:0, y:0}],
    // 1 - East (R)
    [{x:0, y:0}, {x:1, y:0}, {x:1, y:-1}, {x:0, y:2}, {x:1, y:2}],
    // 2 - South
    [{x:0, y:0}, {x:0, y:0}, {x:0, y:0}, {x:0, y:0}, {x:0, y:0}],
    // 3 - West (L)
    [{x:0, y:0}, {x:-1, y:0}, {x:-1, y:-1}, {x:0, y:2}, {x:-1, y:2}]
];

const SRS_OFFSETS_I = [
    // 0 - North
    [{x: 0, y: 0}, {x:-1, y: 0}, {x:+2, y: 0}, {x:-1, y: 0}, {x:+2, y: 0}],
    
    // 1 - East
    // TETR.IO SRS+: Start op (0,0) -> Geen wobble naar rechts!
    [{x: 0, y: 0}, {x:-1, y: 0}, {x:+2, y: 0}, {x:-1, y:+1}, {x:+2, y:-2}],
    
    // 2 - South
    [{x:-1, y:+1}, {x: 0, y:+1}, {x:-3, y:+1}, {x: 0, y: 0}, {x:-3, y: 0}],
    
    // 3 - West
    // TETR.IO SRS+: Start op (0,0) -> Symmetrisch met East
    [{x: 0, y: 0}, {x:+1, y: 0}, {x:-2, y: 0}, {x:+1, y:+1}, {x:-2, y:-2}]
];

export function getSRSOffsets(piece: Piece, newRot: Rotation): { x: number, y: number }[] {
	if (piece.type === "O") return [{x:0, y:0}];

	const table = piece.type === "I" ? SRS_OFFSETS_I : SRS_OFFSETS_JLSTZ;
	const currentOffsets = table[piece.rotation];
	const newOffsets = table[newRot];

	const kicks: { x: number, y: number }[] = [];

	for (let i = 0; i < 5; i++) {
		const valX = currentOffsets[i].x - newOffsets[i].x;
		const valY = currentOffsets[i].y - newOffsets[i].y;

		kicks.push({
				x: valX,
				y: -valY 
		});
	}

	return kicks;
}
