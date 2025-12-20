export {}; 
declare global {
	interface CanvasRenderingContext2D {
		strokeOuterRect(x: number, y: number, w: number, h: number): void;
		strokeInnerRect(x: number, y: number, w: number, h: number): void;
	}
}

CanvasRenderingContext2D.prototype.strokeOuterRect = function(
    x: number, y: number, w: number, h: number
) {
	const lw = this.lineWidth;
	if (lw <= 0) return;
	const offset = lw / 2;

	this.strokeRect(
			x - offset, 
			y - offset, 
			w + lw, 
			h + lw
	);
};

CanvasRenderingContext2D.prototype.strokeInnerRect = function(
    x: number, y: number, w: number, h: number
) {
	const lw = this.lineWidth;
	if (lw <= 0) return;
	const offset = lw / 2;

	this.strokeRect(
			x + offset, 
			y + offset, 
			w - lw, 
			h - lw
	);
};
