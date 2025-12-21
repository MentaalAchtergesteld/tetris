import { Size } from "../core/types";
import { Widget } from "../core/widget";

export class SizedBox extends Widget {
	constructor(
		private width: number,
		private height: number
	) { super(); }

	getMinSize(): Size {
		return { width: this.width, height: this.height}
	}

	draw(): void {}
}
