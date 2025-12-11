export type Color = string | CanvasGradient | CanvasPattern;

export interface GameTheme {
	Name: string,
	Colors: {
		Background: Color,
		BoardBackground: Color,
		BoardBorder: Color,
		PieceI: Color;
		PieceJ: Color;
		PieceL: Color;
		PieceO: Color;
		PieceS: Color;
		PieceT: Color;
		PieceZ: Color;
		PiecePreview: Color;
		PieceBorder: Color;
		TextPrimary: Color;
		TextSecondary: Color;
		Accent: Color;
	};

	Layout: {
		BlockSize: number;
		PanelGap: number;
		BorderWidth: number;
		CornerRadius: number;
	};

	Typography: {
		TitleFontFamily: string;
		TitleFontSize: number;
		DataFontFamily: string;
		DataFontSize: number;
	}
}

export const DEFAULT_THEME: GameTheme = {
	Name: "Default",
	Colors: {
		Background: "hsl(0, 0%, 15%)",
		BoardBackground: "hsla(0, 0%, 5%, 0.8)",
		BoardBorder: "hsl(0, 0%, 90%)",
		PieceI: "hsl(190, 90%, 60%)",
		PieceJ: "hsl(240, 90%, 60%)",
		PieceL: "hsl(35, 90%, 60%)",
		PieceO: "hsl(60, 90%, 60%)",
		PieceS: "hsl(110, 90%, 60%)",
		PieceT: "hsl(290, 90%, 60%)",
		PieceZ: "hsl(0, 90%, 60%)",
		PiecePreview: "hsla(0, 0%, 25%, 0.5)",
		PieceBorder: "hsla(0, 0%, 5%, 0.5)",
		TextPrimary: "hsl(0, 0%, 90%)",
		TextSecondary: "hsl(0, 0%, 90%)",
		Accent: "hsl(100, 85%, 55%)",
	},

	Layout: {
		BlockSize: 32,
		PanelGap: 16,
		BorderWidth: 4,
		CornerRadius: 0,
	},

	Typography: {
		TitleFontFamily: "Audiowide",
		TitleFontSize: 28,
		DataFontFamily: "Share Tech Mono",
		DataFontSize: 25,
	}

}
