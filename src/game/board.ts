import { Piece } from "../piece";

export class Board {
	width: number;
	height: number;
	grid: number[][];

	constructor(width: number = 10, height: number = 20) {
		this.width = width;
		this.height = height;

		this.initializeGrid();
	}

	reset() {
		this.initializeGrid();
	}

	private initializeGrid() {
		this.grid = Array.from({ length: this.height }, () => Array(this.width).fill(0));
	}

	isEmpty(x: number, y: number): boolean {
		return (
			x >= 0 &&
			x < this.width &&
			y >= 0 &&
			y < this.height &&
			this.grid[y][x] === 0
		)
	}

	isValidPosition(shape: number[][], x: number, y: number): boolean {
		for (let dy = 0; dy < shape.length; dy++) {
			for (let dx = 0; dx < shape[dy].length; dx++) {
				if (shape[dy][dx] == 0) continue;
				if (!this.isEmpty(x+dx, y+dy)) return false;
			}
		}
		return true;
	}

	lockPiece(piece: Piece) {
		piece.shape.forEach((row, y) => {
			row.forEach((value, x) => {
				if (value == 0) return;
				const boardX = piece.x + x;
				const boardY = piece.y + y;

				if (boardX < 0 || boardX >= this.width) return;
				if (boardY < 0 || boardY >= this.height) return;
				this.grid[boardY][boardX] = value;
			})
		})
	}

	checkLineClear(): number {
		let linesCleared = 0;
		for (let y = this.height-1; y >= 0; y--) {
			if(this.grid[y].includes(0)) continue;
			this.grid.splice(y, 1);
			const emptyRow = Array(this.width).fill(0);
			this.grid.unshift(emptyRow);
			y++;
			linesCleared++;
		}
		return linesCleared;
	}

	print() {
		console.table(this.grid);
	}
}
