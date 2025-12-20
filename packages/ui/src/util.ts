import { Size } from "./core/types";

const offscreenCanvas = document.createElement("canvas");
const offscreenCtx = offscreenCanvas.getContext("2d")!;

export function measureText(text: string, fontFamily: string, fontSize: number, fontWeight: number | string = "normal"): Size {
	offscreenCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
	const bounds = offscreenCtx.measureText(text);
	return {
		width: bounds.width,
		height: bounds.actualBoundingBoxAscent + bounds.actualBoundingBoxDescent,
	}
}
