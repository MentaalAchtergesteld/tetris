import { GameTheme } from "../theme";

export interface Size {
	width: number;
	height: number;
}

export type Align = "start" | "center" | "end";

export interface LayoutData {
	expand: boolean;
	fill: boolean;
	align: Align;
}

export abstract class Widget {
	public layout: LayoutData = {
		expand: false,
		fill: false,
		align: "center"
	};

	public setExpand(val: boolean) { this.layout.expand = val; return this; }
	public setFill(val: boolean) { this.layout.fill = val; return this; }
	public setAlign(val: Align) { this.layout.align = val; return this; }

	abstract getMinSize(theme: GameTheme): Size;
	abstract draw(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, theme: GameTheme): void;
}


const offscreenCanvas = document.createElement("canvas");
const offscreenCtx = offscreenCanvas.getContext("2d")!;

export function measureText(text: string, font: string, fontSize: number): Size {
	offscreenCtx.font = `${fontSize}px ${font}`;
	const bounds = offscreenCtx.measureText(text);
	return {
		width: bounds.width,
		height: bounds.actualBoundingBoxAscent + bounds.actualBoundingBoxDescent,
	}
}
