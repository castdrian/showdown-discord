import type { ObjectReadStream, ObjectReadWriteStream } from '@pkmn/sim/build/lib/streams';
import type { AttachmentBuilder } from 'discord.js';
import type { RomajiMon, RomajiMove } from 'pkmn-romaji';

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

export interface PokePasteResponse {
	author: string;
	notes: string;
	paste: string;
	title: string;
}
