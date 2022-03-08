/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import type { Handler, Protocol } from '@pkmn/protocol';
import type { Battle } from '@pkmn/client';

export class PreHandler implements Handler<void> {
	// @ts-ignore whatever this is
	constructor(private battle: Battle) {
		this.battle = battle;
	}

	// @ts-ignore lul
	'|faint|'(args: Protocol.Args['|faint|']) {}
}
