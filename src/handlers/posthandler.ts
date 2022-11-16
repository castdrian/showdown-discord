/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import type { Handler, Protocol } from '@pkmn/protocol';
import type { Battle } from '@pkmn/client';
import { waitFor } from '#util/functions';
import { moveChoice, switchChoice, updateBattleEmbed } from '#handlers/battlescreen';
import type { Message, User } from 'discord.js';
import type { BattleStreams } from '#types/index';
import type NodeCache from 'node-cache';

export class PostHandler implements Handler<void> {
	// @ts-ignore whatever this is
	constructor(
		private readonly battle: Battle,
		private streams: BattleStreams,
		private message: Message,
		private user: User,
		private cache: NodeCache
	) {
		this.battle = battle;
		this.streams = streams;
		this.message = message;
		this.user = user;
		this.cache = cache;
	}

	'|teampreview|'() {}

	async '|turn|'() {
		if (this.battle.request?.requestType === 'move') {
			// @ts-ignore missing types
			this.battle.p1.active[0].canZMove = this.battle.request.active[0].canZMove;
			// @ts-ignore missing types
			this.battle.p1.active[0].zMoves = this.battle.request.active[0].zMoves;
			(await waitFor(() => this.cache.get('battlelog'))) !== null;
			await updateBattleEmbed(this.battle, this.message, this.cache);
			await moveChoice(this.streams, this.battle, this.message, this.user, this.cache);
		} else if (this.battle.request?.requestType === 'switch') {
			(await waitFor(() => this.cache.get('battlelog'))) !== null;
			await switchChoice(this.streams, this.battle, this.message, this.user, this.cache);
		} else if (this.battle.request?.requestType === 'wait') {
			(await waitFor(() => this.cache.get('battlelog'))) !== null;
			await updateBattleEmbed(this.battle, this.message, this.cache);
		}
	}

	async '|switch|'(args: Protocol.Args['|switch|']) {
		const poke = this.battle.getPokemon(args[1]);
		if (poke?.side === this.battle.p1 && this.battle.p1.lastPokemon) {
			if (this.battle.p1.active[0]?.name === this.battle.p1.lastPokemon.name) {
				this.battle.p1.active[0] = this.battle.p1.lastPokemon;
				await updateBattleEmbed(this.battle, this.message, this.cache);
			}
		}
	}

	async '|win|'() {
		await updateBattleEmbed(this.battle, this.message, this.cache, []);
		this.battle.destroy();
	}

	async '|tie|'() {
		await updateBattleEmbed(this.battle, this.message, this.cache, []);
		this.battle.destroy();
	}

	'|-start|'(args: Protocol.Args['|-start|']) {
		// looks like this: [ '-start', 'p1a: Dracozolt', 'Dynamax' ]
		// destructure index 1 and 2
		const [, pokemon, effect] = args;
		// if effect is Dynamax or Gmax, and the pokemon is on side p1a, then set process.isMax to true
		if (effect === 'Dynamax' || effect === 'Gmax') {
			if (pokemon.startsWith('p1a')) {
				this.cache.set('isMax', true);
			}
		}
	}

	'|-end|'(args: Protocol.Args['|-end|']) {
		// looks like this: [ '-end', 'p1a: Dracozolt', 'Dynamax' ]
		// destructure index 1 and 2
		const [, pokemon, effect] = args;
		// if effect is Dynamax or Gmax, and the pokemon is on side p1a, then set process.isMax to false
		if (effect === 'Dynamax' || effect === 'Gmax') {
			if (pokemon.startsWith('p1a')) {
				this.cache.set('isMax', false);
			}
		}
	}
}
