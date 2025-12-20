import { Widget } from "../core/widget";
import { LinearLayout, Orientation } from "./linear";

export class HBox extends LinearLayout {
	constructor(children: Widget[] = [], gap = 10) {
		super(children, gap, Orientation.Horizontal);
	}
}
