import { GameAction } from "../game/actions";
import { Piece } from "../game/piece";

export enum PacketType {
	JoinQueue = "c2sJoinQueue",
	Ready = "c2sReady",
	Action = "c2sAction",

	MatchStart = "s2cMatchStart",
	MatchEnd = "s2cMatchEnd",
	SelfState = "s2cSelfState",
	OppState = "s2cOppState",
	GarbageIn = "s2cGarbageIn",
	GarbageOut = "s2cGarbageOut",
	Seed = "s2cSeed",
	LobbyState = "s2cLobbyState",
}

export interface ActionPayload {
	action: GameAction,
	data: number,
}

export interface StatePayload {
	grid: number[][],
	currentPiece: Piece | null,
}

export interface GarbagePayload {
	amount: number,
}

export interface MatchStartPayload {
	seed: number,
	opponentId: string,
}

export interface MatchEndPayload {
	winnerId: string,
	reason?: string,
}

export interface SeedPayload {
	seed: number;
}

export enum LobbyState {
	WaitingForOpp,
	WaitingForReady
}

export interface LobbyStatePayload {
	state: LobbyState
}

export interface Client2ServerEvents {
	[PacketType.JoinQueue]: () => void;
	[PacketType.Ready]: () => void;
	[PacketType.Action]: (data: ActionPayload) => void;
}

export interface Server2ClientEvents {
	[PacketType.Action]: (data: ActionPayload) => void;

	[PacketType.MatchStart]: (data: MatchStartPayload) => void;
	[PacketType.MatchEnd]: (data: MatchEndPayload) => void;
	
	[PacketType.SelfState]: (data: StatePayload) => void;
	[PacketType.OppState]: (data: StatePayload) => void;

	[PacketType.GarbageIn]: (data: GarbagePayload) => void;
	[PacketType.GarbageOut]: (data: GarbagePayload) => void;

	[PacketType.Seed]: (data: SeedPayload) => void;
	[PacketType.LobbyState]: (data: LobbyStatePayload) => void;
}
