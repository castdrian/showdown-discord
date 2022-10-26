/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import type { Handler } from '@pkmn/protocol';
import type { Battle } from '@pkmn/client';
import { waitFor } from '#util/functions';
import { moveChoice, switchChoice, updateBattleEmbed } from '#handlers/battlescreen';
import type { CommandInteraction } from 'discord.js';
import type { ObjectReadStream, ObjectReadWriteStream } from '@pkmn/sim/build/lib/streams';

interface BattleStreams {
	omniscient: ObjectReadWriteStream<string>;
	spectator: ObjectReadStream<string>;
	p1: ObjectReadWriteStream<string>;
	p2: ObjectReadWriteStream<string>;
	p3: ObjectReadWriteStream<string>;
	p4: ObjectReadWriteStream<string>;
}

export class PostHandler implements Handler<void> {
	// @ts-ignore whatever this is
	constructor(private readonly battle: Battle, private streams: BattleStreams, private interaction: CommandInteraction) {
		this.battle = battle;
		this.streams = streams;
		this.interaction = interaction;
	}

	'|teampreview|'() {
		console.log('teampreview');
	}

	async '|turn|'() {
		console.log('turn');
		if (this.battle.request?.requestType === 'move') {
			await waitFor(() => process.battlelog.length !== 0);
			/* 	if (battle.p1.lastPokemon?.name) {
				process.battlelog = [];
				await switchChoice(streams, battle, interaction);
				await waitFor(() => process.battlelog.length !== 0);
				await updateBattleEmbed(battle, interaction);
			} else { */
			await updateBattleEmbed(this.battle, this.interaction);
			await moveChoice(this.streams, this.battle, this.interaction);
			// process.this.battlelog = [];
			// }
		} else if (this.battle.request?.requestType === 'switch') {
			await waitFor(() => process.battlelog.length !== 0);
			await switchChoice(this.streams, this.battle, this.interaction);
			// process.battlelog = [];
		} else if (this.battle.request?.requestType === 'wait') {
			await waitFor(() => process.battlelog.length !== 0);
			await updateBattleEmbed(this.battle, this.interaction);
		}
	}
}
