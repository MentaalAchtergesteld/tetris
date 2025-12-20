export interface TextStyle {
	fontFamily: string;
	fontSize: number;
	fontWeight?: string | number;
	lineHeight?: number;
	color?: string;
};

export interface BaseTheme {
	colors: {
		background: string;
		surface: string;
		border: string;
	};
	typography: {
		default: TextStyle,
		[key: string]: TextStyle,
	}
	spacing: {
		padding: number;
		margin: number;
	}
}

export const DEFAULT_THEME: BaseTheme = {
	colors: {
		background: "#000",
		surface: "#222",
		border: "#444",
	},
	typography: { 
		default: { fontFamily: "Arial", fontSize: 16, color: "#fff" },
	},
	spacing: { padding: 8, margin: 8 },
};
