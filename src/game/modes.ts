import { GameTheme } from "../theme";
import { AudioManager, EffectsManager } from "../engine/audio";
import { ScreenShake, ScreenRecoil, ScreenRecoilSettings } from "../engine/vfx";

export interface GameContext {
	effects: EffectsManager,
	audio: AudioManager;
	shake: ScreenShake;
	shakeIntensityMultiplier: number;
	recoil: ScreenRecoil;
	recoilSettings: ScreenRecoilSettings,
}

export interface GameMode {
	onEnter(ctx: GameContext): void;
	onExit(): void;

	update(dt: number): void;
	draw(ctx: CanvasRenderingContext2D, theme: GameTheme): void;
}
