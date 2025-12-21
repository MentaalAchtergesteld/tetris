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

export type Provider<T> = T | (() => T);

export function resolve<T>(val: Provider<T>): T {
	if (typeof val == "function") {
		return (val as () => T)();
	}
	return val;
}
