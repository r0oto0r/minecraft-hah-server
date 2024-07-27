export interface SpawnMob {
	id: number;
	team: string;
	lane: string;
	count: number;
	customNames: string[];
};

export enum MessageTypes {
	SpawnMob = "SpawnMob"
};
