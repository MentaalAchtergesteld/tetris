import { Widget } from "../core/widget";
import { LinearLayout, Orientation } from "./linear";

export class VBox extends LinearLayout {
	constructor(children: Widget[] = [], gap = 10) {
		super(children, gap, Orientation.Vertical);
	}
}
