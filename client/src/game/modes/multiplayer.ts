import { io, Socket } from "socket.io-client";
import { GameTheme } from "../../theme";
import { GameContext, GameMode } from "../modes";
import { C2SEvents, Game, S2CEvents } from "@tetris/shared";
import { LocalController } from "../../engine/input/controller";
import { InputManager } from "../../engine/input/input_manager";
import { DangerLevel } from "../danger";
import { Widget } from "../../ui/widget";
import { Recoil, Shaker } from "../../ui/widgets/effects";
import { HBox, Overlay } from "../../ui/widgets/layout";
import { Switch } from "../../ui/widgets/logic";
import { StandardGame } from "../../ui/widgets/standard_game";
import { Label } from "../../ui/widgets/label";

enum GameState {
	JoiningQueue,
	InQueue,
	InRoom,
	Ready,
	InMatch,
	AfterMatch,
	FinishMatch,
}

export class MultiplayerMode implements GameMode {
	private readonly URL = "http://localhost:9000";

	private state: GameState;
	private socket: Socket<S2CEvents, C2SEvents>;
	private input: InputManager;
	private context: GameContext | null = null;
	private countdownTimer: number = 0;

	private layout: Widget;
	private dangerLevel: DangerLevel;
	private shaker: Shaker;
	private recoil: Recoil;

	private localGame: Game;
	private remoteGame: Game;

	private localController: LocalController;

	constructor() {
		this.state = GameState.JoiningQueue;
		this.socket = io(this.URL);

		this.localGame = new Game();
		this.remoteGame = new Game();

		this.localController = new LocalController(this.localGame, this.input);

		this.layout = this.buildLayout();
		this.dangerLevel = new DangerLevel(this.localGame, this.shaker);

		this.bindEvents();
		this.joinQueue();
	}

	private joinQueue() {}

	private bindEvents() {}

	private buildGameLayout(game: Game, isLocal: boolean): Widget {
		const labelText = isLocal ? "you" : "other";
		const dangerProvider = isLocal ? () => this.dangerLevel.getLevel() : () => 0;
		return new StandardGame(game, [
			new Label(() => labelText, "title", "right"),
		], dangerProvider, () => this.countdownTimer+1);
	}

	private buildRoomLayout(): Widget {}

	private buildResultsLayout(): Widget {}

	private buildLayout(): Widget {
		const localGame = this.buildGameLayout(this.localGame, true);
		const remoteGame = this.buildGameLayout(this.remoteGame, false);
		const gameLayout = new HBox([localGame, remoteGame], 64);

		const roomLayout = this.buildRoomLayout();

		const lobbyOrGameLayout = new Switch(() => {
			switch (this.state) {
				case GameState.JoiningQueue: return 0;
				case GameState.InQueue:      return 1;
				case GameState.InRoom:       return 2;
				default: return 3;
			}
		},[
			new Label(() => "joining queue", "title", "center"),
			new Label(() => "in queue", "title", "center"),
			roomLayout,
			gameLayout
		]);

		const resultsLayout = this.buildResultsLayout();

		const base = new Overlay([lobbyOrGameLayout, resultsLayout]);

		this.shaker = new Shaker(base);
		this.recoil = new Recoil(this.shaker,
			() => this.context?.recoilTension || 0,
			() => this.context?.recoilDamping|| 0,
			() => this.context?.recoilMass || 0,
		);

		return this.recoil;
	}

	onEnter(ctx: GameContext): void {
	    
	}

	onExit(): void {
	    
	}

	update(dt: number): void {
	    
	}

	draw(ctx: CanvasRenderingContext2D, theme: GameTheme): void {
	    
	}
}
