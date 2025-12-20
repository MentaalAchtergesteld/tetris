import { Size } from "../core/types";
import { Widget } from "../core/widget";

export class Spacer extends Widget {
	constructor() {
		super();
		this.layout.expand = true;
	}

	getMinSize(): Size {
		return { width: 0, height: 0 }; 
	}

	draw(): void {}
}
