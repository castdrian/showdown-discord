import type { CommandInteraction } from 'discord.js';
import { Dex, Teams, RandomPlayerAI, BattleStreams, Move } from '@pkmn/sim';
import { Protocol, Handler, ArgName, ArgType, BattleArgsKWArgType } from '@pkmn/protocol';
import { Battle } from '@pkmn/client';
import { TeamGenerators } from '@pkmn/randoms';
import { LogFormatter, ChoiceBuilder } from '@pkmn/view';
import { Generations } from '@pkmn/data';

export async function initiateBattle(interaction: CommandInteraction) {
	
}
