/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import type { Handler } from '@pkmn/protocol';
import type { Battle } from '@pkmn/client';

export class PostHandler implements Handler<void> {
	// @ts-ignore whatever this is
	constructor(private readonly battle: Battle) {
		this.battle = battle;
	}

	'|teampreview|'() {}

	'|turn|'() {}
}
