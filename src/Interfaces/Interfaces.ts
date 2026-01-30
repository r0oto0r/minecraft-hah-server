import { MobType } from "./MobTypes";
import { Lane } from "./LaneTypes";

export interface SpawnMob {
	id: number;
	team: string;
	lane: string;
	count: number;
	customNames: string[];
};

export interface UserSelection {
	userId: string;
	mobType: MobType;
	lane: Lane;
}

export interface AuthRequest {
	userId: string;
	token: string;
}

export interface AuthResponse {
	success: boolean;
	sessionId?: string;
	error?: string;
}

export interface SelectMobRequest {
	mobType: MobType;
}

export interface SelectLaneRequest {
	lane: Lane;
}

export interface StateUpdate {
	userId: string;
	mobType?: MobType;
	lane?: Lane;
}

export interface FullState {
	users: Map<string, UserSelection>;
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
	FullStateSync = "FullStateSync",
	StateDiff = "StateDiff"
};
