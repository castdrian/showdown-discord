import type { ObjectReadStream, ObjectReadWriteStream } from '@pkmn/sim/build/lib/streams';
import type { RomajiMon, RomajiMove } from 'pkmn-romaji';
declare global {
	namespace NodeJS {
		export interface Process {
			battlelog: string[];
			romaji: boolean;
			romajiMons: RomajiMon[];
			romajiMoves: RomajiMove[];
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
