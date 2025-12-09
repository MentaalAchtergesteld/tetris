export type Color = string | CanvasGradient | CanvasPattern;
export interface ColorTheme {
	Background: Color;

	PieceI: Color;
	PieceJ: Color;
	PieceL: Color;
	PieceO: Color;
	PieceS: Color;
	PieceT: Color;
	PieceZ: Color;
	PiecePreview: Color;
	PieceBorder: Color;

	TileBorder: Color;
	BoardBackground: Color;
	BoardBorder: Color;
}

export const DEFAULT_THEME: ColorTheme = {
	Background: "hsl(0, 0%, 15%)",
	
  PieceI: "hsl(190, 90%, 60%)",
  PieceJ: "hsl(240, 90%, 60%)",
  PieceL: "hsl(35, 90%, 60%)",
  PieceO: "hsl(60, 90%, 60%)",
  PieceS: "hsl(110, 90%, 60%)",
  PieceT: "hsl(290, 90%, 60%)",
  PieceZ: "hsl(0, 90%, 60%)",
	PiecePreview: "hsla(0, 0%, 25%, 0.5)",
	PieceBorder: "hsla(0, 0%, 5%, 0.5)",

	TileBorder:"hsl(0, 0%, 15%)",
	BoardBackground: "hsla(0, 0%, 5%, 0.9)",
	BoardBorder: "hsl(0, 0%, 90%)",
}
