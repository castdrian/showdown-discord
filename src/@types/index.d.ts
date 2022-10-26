import type { ObjectReadStream, ObjectReadWriteStream } from '@pkmn/sim/build/lib/streams';

declare global {
	namespace NodeJS {
		export interface Process {
			battlelog: string[];
		}
	}
}

export interface formaticon {
	[key: string]: string;
}

export interface BattleStreams {
	omniscient: ObjectReadWriteStream<string>;
	spectator: ObjectReadStream<string>;
	p1: ObjectReadWriteStream<string>;
	p2: ObjectReadWriteStream<string>;
	p3: ObjectReadWriteStream<string>;
	p4: ObjectReadWriteStream<string>;
}
