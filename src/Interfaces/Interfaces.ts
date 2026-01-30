import { MobType } from "./MobTypes";
import { Lane } from "./LaneTypes";

export interface SpawnMob {
	id: number;
	team: string;
	lane: string;
	count: number;
	customNames: string[];
};

export enum ChannelMode {
	SINGLE = "SINGLE",
	DUAL = "DUAL"
}

export interface UserSelection {
	userId: string;
	mobType: MobType;
	lane: Lane;
	team?: string;        // Required in single channel mode
	channelName?: string; // Used in dual channel mode
}

export interface AuthRequest {
	userId: string;
	token: string;
	channelName?: string; // Optional channel name for dual channel mode
}

export interface AuthResponse {
	success: boolean;
	sessionId?: string;
	error?: string;
	mode?: ChannelMode; // Inform client of current mode
}

export interface SelectMobRequest {
	mobType: MobType;
}

export interface SelectLaneRequest {
	lane: Lane;
}

export interface SelectTeamRequest {
	team: string;
}

export interface SetModeRequest {
	mode: ChannelMode;
}

export interface StateUpdate {
	userId: string;
	mobType?: MobType;
	lane?: Lane;
	team?: string;
	channelName?: string;
}

export interface FullState {
	users: Map<string, UserSelection>;
	mode: ChannelMode;
}

export interface StateDiff {
	added: UserSelection[];
	updated: UserSelection[];
	removed: string[];
}

export enum MessageTypes {
	SpawnMob = "SpawnMob",
	Authenticate = "Authenticate",
	AuthResponse = "AuthResponse",
	SelectMob = "SelectMob",
	SelectLane = "SelectLane",
	SelectTeam = "SelectTeam",
	SetMode = "SetMode",
	FullStateSync = "FullStateSync",
	StateDiff = "StateDiff"
};
