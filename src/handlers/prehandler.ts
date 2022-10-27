/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import type { Handler, Protocol } from '@pkmn/protocol';
import type { Battle } from '@pkmn/client';
import type { CommandInteraction } from 'discord.js';
import type { BattleStreams } from '#types/index';
import { switchChoice } from '#handlers/battlescreen';

export class PreHandler implements Handler<void> {
	// @ts-ignore whatever this is
	constructor(private readonly battle: Battle, private streams: BattleStreams, private command: CommandInteraction) {
		this.battle = battle;
		this.streams = streams;
		this.command = command;
	}

	async '|faint|'(args: Protocol.Args['|faint|']) {
		const poke = this.battle.getPokemon(args[1]);
		if (poke?.side === this.battle.p1) {
			console.log('fainted');
			await switchChoice(this.streams, this.battle, this.command);
		}
	}
}
