export interface Size {
	width: number;
	height: number;
}

export enum Align {
	Start, Center, End
}

export interface LayoutData {
	expand: boolean,
	fill: boolean,
	align: Align
}

export type LayoutOptions = Partial<LayoutData>;

