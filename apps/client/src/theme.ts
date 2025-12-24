import { LabelStyle } from "@tetris/ui";
import { GameStyle } from "./widgets/standard_game";

export interface GameTheme {
	name: string;

	backgroundColor: string;

	layout: {
		gap: number;
	},

	game: GameStyle,

	typography: {
		title: Partial<LabelStyle>,
		data: Partial<LabelStyle>,
		body: Partial<LabelStyle>,
	},
}

export const DEFAULT_THEME: GameTheme = {
	name: "Default",

	backgroundColor: "hsl(0, 0%, 15%)",

	layout: { gap: 16, },

	game: {
		blockSize: 32,
		borderWidth: 4,
		backgroundColor: "hsla(0, 0%, 5%, 0.8)",
		gridLineColor: "hsla(0, 0%, 5%, 0.5)",
		boardBorderColor: "hsl(0, 0%, 90%)",
		dangerColor: "hsl(0, 80%, 50%)",
		ghostColor: "hsla(0, 0%, 25%, 0.5)",
		pieceColors: {
				1: "hsl(0, 0%, 40%)",    // Garbage
				2: "hsl(190, 90%, 60%)", // I
				3: "hsl(240, 90%, 60%)", // J
				4: "hsl(35, 90%, 60%)",  // L
				5: "hsl(60, 90%, 60%)",  // O
				6: "hsl(110, 90%, 60%)", // S
				7: "hsl(290, 90%, 60%)", // T
				8: "hsl(0, 90%, 60%)",   // Z
		}
	},

	typography: {
		title: {
			fontFamily: "Audiowide",
			fontSize: 24,
			fontWeight: "bold",
			color: "hsl(0, 0%, 90%)",
		},
		data: {
			fontFamily: "Share Tech Mono",
			fontSize: 22,
			fontWeight: "normal",
			color: "hsl(0, 0%, 90%)",
		},
		body: {
			fontFamily: "Arial",
			fontSize: 14,
			fontWeight: "normal",
			color: "hsl(0, 0%, 85%)"
		}
	}
}
