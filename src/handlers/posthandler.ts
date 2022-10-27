/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import type { Handler, Protocol } from '@pkmn/protocol';
import type { Battle } from '@pkmn/client';
import { waitFor } from '#util/functions';
import { moveChoice, switchChoice, updateBattleEmbed } from '#handlers/battlescreen';
import type { MessageComponentInteraction } from 'discord.js';
import type { BattleStreams } from '#types/index';

export class PostHandler implements Handler<void> {
	// @ts-ignore whatever this is
	constructor(private readonly battle: Battle, private streams: BattleStreams, private interaction: MessageComponentInteraction) {
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
			console.log('switchchoice');
			await waitFor(() => process.battlelog.length !== 0);
			await switchChoice(this.streams, this.battle, this.interaction);
			// process.battlelog = [];
		} else if (this.battle.request?.requestType === 'wait') {
			await waitFor(() => process.battlelog.length !== 0);
			await updateBattleEmbed(this.battle, this.interaction);
		}
	}

	async '|switch|'(args: Protocol.Args['|switch|']) {
		console.log('switch event');
		console.log(args);
		const poke = this.battle.getPokemon(args[1]);
		if (poke?.side === this.battle.p1 && this.battle.p1.lastPokemon?.fainted) {
			await waitFor(() => process.battlelog.length !== 0);
			await updateBattleEmbed(this.battle, this.interaction);
		}
	}
}
