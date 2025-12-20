export function pieceIndexToColor(value: number, theme: GameTheme): Color {
	switch (value) {
		case 0: return "transparent";
		case 1: return theme.Colors.Garbage;
		case 2: return theme.Colors.PieceI;
		case 3: return theme.Colors.PieceJ;
		case 4: return theme.Colors.PieceL;
		case 5: return theme.Colors.PieceO;
		case 6: return theme.Colors.PieceS;
		case 7: return theme.Colors.PieceT;
		case 8: return theme.Colors.PieceZ;
		default: return "#FFFFFF";
	}
}

export function drawPieceShape(
	piece: number[][],
	x: number,
	y: number,
	size: number,
	isPreview: boolean,
	theme: GameTheme,
	ctx: CanvasRenderingContext2D
) {
	piece.forEach((row: number[], dy: number) => {
		row.forEach((value: number, dx: number) => {
			if (value == 0) return;
			ctx.fillStyle = isPreview ? theme.Colors.PiecePreview : pieceIndexToColor(value, theme);
			ctx.fillRect(x + dx*size, y + dy*size, size, size);

			ctx.strokeStyle = theme.Colors.PieceBorder;
			ctx.lineWidth = 1;
			ctx.strokeRect(x + dx*size, y + dy*size, size, size);
		})
	});
}

export function drawPieceCentered(
	shape: number[][],
	bx: number, by: number, bw: number, bh: number,
	size: number,
	theme: GameTheme,
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

			ctx.strokeStyle = theme.Colors.PieceBorder;
			ctx.lineWidth = 1;
			ctx.strokeRect(px, py, size, size);
		})
	})
}
