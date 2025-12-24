import { getPieceBounds } from "@tetris/core";

export function drawPieceShape(
	piece: number[][],
	x: number,
	y: number,
	size: number,
	isPreview: boolean,
	colors: Record<number, string>,
	borderColor: string,
	ghostColor: string,
	ctx: CanvasRenderingContext2D
) {
	piece.forEach((row: number[], dy: number) => {
		row.forEach((value: number, dx: number) => {
			if (value == 0) return;
			ctx.fillStyle = isPreview ? ghostColor : colors[value] || "grey";
			ctx.fillRect(x + dx*size, y + dy*size, size, size);

			ctx.strokeStyle = borderColor;
			ctx.lineWidth = 1;
			ctx.strokeRect(x + dx*size, y + dy*size, size, size);
		})
	});
}

export function drawPieceCentered(
	shape: number[][],
	bx: number, by: number, bw: number, bh: number,
	size: number,
	colors: Record<number, string>,
	borderColor: string,
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

			const color = colors[val] || "grey";
			ctx.fillStyle = color;
			ctx.fillRect(px, py, size, size);

			ctx.strokeStyle = borderColor;
			ctx.lineWidth = 1;
			ctx.strokeRect(px, py, size, size);
		})
	})
}
