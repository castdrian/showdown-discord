import { Dex, Teams, RandomPlayerAI, BattleStreams, type PokemonSet } from '@pkmn/sim';
import { Protocol, type Handler, type ArgName, type ArgType, type BattleArgsKWArgType } from '@pkmn/protocol';
import { Battle } from '@pkmn/client';
import { TeamGenerators } from '@pkmn/randoms';
import { LogFormatter } from '@pkmn/view';
import { Generations } from '@pkmn/data';
import { PreHandler } from '#handlers/prehandler';
import { PostHandler } from '#handlers/posthandler';
import type { CommandInteraction, Message, User } from 'discord.js';
import { default as removeMD } from 'remove-markdown';
import { sendErrorToUser } from '#util/functions';
import type NodeCache from 'node-cache';

export async function initiateBattle(
	interaction: CommandInteraction,
	message: Message,
	user: User,
	formatid: string,
	team: PokemonSet[] | null,
	cache: NodeCache
) {
	Teams.setGeneratorFactory(TeamGenerators);
	const gens = new Generations(Dex as any);
	const custom_team = Teams.pack(team);

	const spec = { formatid };
	const p1spec = { name: user.username, team: custom_team ?? Teams.pack(Teams.generate('gen8randombattle')) };
	const p2spec = { name: 'Showdown! AI', team: Teams.pack(Teams.generate('gen8randombattle')) };

	const streams = BattleStreams.getPlayerStreams(new BattleStreams.BattleStream());

	const p2 = new RandomPlayerAI(streams.p2);
	void p2.start();

	const battle = new Battle(gens);
	const formatter = new LogFormatter('p1', battle);

	const pre = new PreHandler(battle, streams, message, user, cache);
	const post = new PostHandler(battle, streams, message, user, cache);

	const addHandler = <T>(handler: Handler<T>, argName: ArgName | undefined, arg: ArgType, kwarg: BattleArgsKWArgType) => {
		if (argName && argName in handler) {
			(handler as any)[argName](arg, kwarg);
		}
	};

	cache.set('battlelog', []);

	await Promise.all(
		[omniscientStream(), playerStream(), startBattle()].map((promise) => promise.catch((error) => sendErrorToUser(error, message, interaction)))
	);

	async function omniscientStream() {
		for await (const chunk of streams.omniscient) {
			const lines = chunk.split('\n');
			for (const line of lines) {
				const { args, kwArgs } = Protocol.parseBattleLine(line);

				if (args && Object.keys(args).length > 0) {
					const text = formatter.formatText(args, kwArgs);
					const key = Protocol.key(args);

					addHandler(pre, key, args, kwArgs);
					battle.add(args, kwArgs);
					addHandler(post, key, args, kwArgs);

					if (text) {
						const log: string[] = cache.get('battlelog') ?? [];
						log.push(removeMD(text));
						cache.set('battlelog', log);
					}
				}
			}

			battle.update();
		}
	}

	async function playerStream() {
		for await (const chunk of streams.p1) {
			const lines = chunk.split('\n');
			for (const line of lines) {
				const { args, kwArgs } = Protocol.parseBattleLine(line);

				if (args && Object.keys(args).length > 0) {
					battle.add(args, kwArgs);
				}
			}

			battle.update();
		}
	}

	async function startBattle() {
		await streams.omniscient.write(`>start ${JSON.stringify(spec)}
>player p1 ${JSON.stringify(p1spec)}
>player p2 ${JSON.stringify(p2spec)}`);
	}
}
