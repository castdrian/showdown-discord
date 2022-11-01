import type { Battle } from '@pkmn/client';
import type { BaseMessageComponentOptions, Message, MessageActionRow, MessageActionRowOptions, MessageComponentInteraction, User } from 'discord.js';
import { Sprites } from '@pkmn/img';
import { ChoiceBuilder } from '@pkmn/view';
import { formatBattleLog } from '#util/ansi';
import type { MoveName } from '@pkmn/dex';
import { Dex } from '@pkmn/sim';

export async function updateBattleEmbed(
	battle: Battle,
	message: Message,
	user: User,
	extComponents?: (MessageActionRow | (Required<BaseMessageComponentOptions> & MessageActionRowOptions))[]
): Promise<void> {
	if (process.romaji && process.romajiMons && process.romajiMoves) {
		// overwrite active mons and moves with romaji
		for (const mon of battle.p1.active) {
			if (mon) {
				mon.name = process.romajiMons.find((m) => m.name.toLowerCase() === mon.name.toLowerCase())?.trademark ?? mon.name;
				for (const move of mon.moveSlots) {
					move.name =
						(process.romajiMoves.find((m) => m.move.replace(/\s/g, '').toLowerCase() === move.name.replace(/\s/g, '').toLowerCase())
							?.romaji as MoveName) ?? move.name;
				}
			}
		}

		// repeat for foe
		for (const mon of battle.p1.foe.active) {
			if (mon) {
				mon.name = process.romajiMons.find((m) => m.name.toLowerCase() === mon.name.toLowerCase())?.trademark ?? mon.name;
				for (const move of mon.moveSlots) {
					move.name =
						(process.romajiMoves.find((m) => m.move.replace(/\s/g, '').toLowerCase() === move.name.replace(/\s/g, '').toLowerCase())
							?.romaji as MoveName) ?? move.name;
				}
			}
		}
	}

	const activemon = battle.p1.active[0];
	const opponent = battle.p1.foe.active[0];
	console.log(activemon?.maxMoves);
	console.log('max moves');

	const { url: activesprite } = Sprites.getPokemon(activemon?.species.name as string, { gen: 'ani', shiny: activemon?.shiny, side: 'p1' });
	const { url: opponentprite } = Sprites.getPokemon(opponent?.species.name as string, { gen: 'ani', shiny: opponent?.shiny, side: 'p2' });

	const embeds = [
		{
			author: {
				name: `${opponent?.name} | ${opponent?.hp}/${opponent?.maxhp} HP ${opponent?.status ? `| ${opponent.status.toUpperCase()}` : ''}`,
				iconURL: message.client.user?.displayAvatarURL()
			},
			thumbnail: { url: opponentprite },
			color: '0x5865F2',
			description: formatBattleLog(process.battlelog, battle),
			image: { url: activesprite },
			footer: {
				text: `${activemon?.name} | ${activemon?.hp}/${activemon?.maxhp} HP ${
					activemon?.status ? `| ${activemon.status.toUpperCase()}` : ''
				}`,
				iconURL: user.displayAvatarURL()
			}
		}
	] as any;

	const components = [
		{
			type: 1,
			components: [
				{
					type: 2,
					custom_id: activemon?.moveSlots[0]?.id ?? 'move1',
					// @ts-ignore pp props missing from types
					label: `${activemon?.moveSlots[0]?.name} ${activemon?.moveSlots[0]?.pp}/${activemon?.moveSlots[0]?.maxpp} PP`,
					style: 1,
					// @ts-ignore disbaled prop missing from types
					disabled: activemon?.moveSlots[0]?.disabled
				},
				{
					type: 2,
					custom_id: activemon?.moveSlots[1]?.id ?? 'move2',
					// @ts-ignore pp props missing from types
					label: `${activemon?.moveSlots[1]?.name} ${activemon?.moveSlots[1]?.pp}/${activemon?.moveSlots[1]?.maxpp} PP`,
					style: 1,
					// @ts-ignore disbaled prop missing from types
					disabled: activemon?.moveSlots[1]?.disabled
				},
				{
					type: 2,
					custom_id: 'forfeit',
					label: 'Forfeit',
					style: 4
				}
			]
		},
		{
			type: 1,
			components: [
				{
					type: 2,
					custom_id: activemon?.moveSlots[2]?.id ?? 'move3',
					// @ts-ignore pp props missing from types
					label: `${activemon?.moveSlots[2]?.name} ${activemon?.moveSlots[2]?.pp}/${activemon?.moveSlots[2]?.maxpp} PP`,
					style: 1,
					// @ts-ignore disbaled prop missing from types
					disabled: activemon?.moveSlots[2]?.disabled
				},
				{
					type: 2,
					custom_id: activemon?.moveSlots[3]?.id ?? 'move4',
					// @ts-ignore pp props missing from types
					label: `${activemon?.moveSlots[3]?.name} ${activemon?.moveSlots[3]?.pp}/${activemon?.moveSlots[3]?.maxpp} PP`,
					style: 1,
					// @ts-ignore disbaled prop missing from types
					disabled: activemon?.moveSlots[3]?.disabled
				},
				{
					type: 2,
					custom_id: 'switch',
					label: 'Switch',
					style: 3,
					disabled: activemon?.trapped
				}
			]
		},
		// add another row if the mon can dynamax, gigantamax, mega evolve, or use z move
		...(activemon?.canDynamax || activemon?.canGigantamax || activemon?.canMegaEvo || activemon?.zMoves?.length
			? [
					{
						type: 1,
						components: [
							// add buttons dynamically based on what the mon can do
							...(activemon?.canDynamax
								? [
										{
											type: 2,
											custom_id: 'dynamax',
											label: process.romaji ? 'Daimax' : 'Dynamax',
											style: 2,
											disabled: !activemon?.canDynamax
										}
								  ]
								: []),
							...(activemon?.canGigantamax
								? [
										{
											type: 2,
											custom_id: 'gigantamax',
											label: process.romaji ? 'Kyodaimax' : 'Gigantamax',
											style: 2,
											disabled: !activemon?.canGigantamax
										}
								  ]
								: []),
							...(activemon?.canMegaEvo
								? [
										{
											type: 2,
											custom_id: 'mega',
											label: process.romaji ? 'Mega Shinka' : 'Mega Evolve',
											style: 2,
											disabled: !activemon?.canMegaEvo
										}
								  ]
								: []),
							...(activemon?.zMoves?.length
								? [
										{
											type: 2,
											custom_id: 'zmove',
											label: process.romaji ? 'Z Waza' : 'Z-Move',
											style: 2,
											disabled: !activemon?.zMoves?.length
										}
								  ]
								: [])
						]
					}
			  ]
			: [])
	];

	await message.edit({ embeds, components: extComponents ?? components, files: [] });
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function moveChoice(streams: any, battle: Battle, message: Message, user: User) {
	const activemon = battle.p1.active[0];
	const builder = new ChoiceBuilder(battle.request!);

	const filter = (i: MessageComponentInteraction) => i.user.id === user.id;
	const collector = message.channel!.createMessageComponentCollector({ filter });

	collector.on('collect', async (i) => {
		await i.deferUpdate();
		if (activemon?.moves.includes(i.customId as any)) {
			collector.stop();
			builder.addChoice(`move ${i.customId}`);
			const choice = builder.toString();
			streams.p1.write(choice);
			await updateBattleEmbed(battle, message, user);
		}
		if (i.customId === 'switch') {
			collector.stop();
			await switchChoice(streams, battle, message, user, true);
		}
		if (i.customId === 'dynamax') {
			collector.stop();
			await activateGimmick('max', streams, battle, message, user);
		}
		if (i.customId === 'cancel') {
			collector.stop();
			await updateBattleEmbed(battle, message, user);
			await moveChoice(streams, battle, message, user);
		}
		if (i.customId === 'forfeit') {
			const forfeit = await forfeitBattle(streams, i, battle, message, user);
			if (forfeit) collector.stop();
		}
	});
}

export async function switchChoice(streams: any, battle: Battle, message: Message, user: User, allowCancel = false) {
	console.log('switching');
	const { team } = battle.p1;
	const builder = new ChoiceBuilder(battle.request!);

	const switch_buttons = [];
	for (const mon of team) {
		let label = mon.name;
		if (process.romaji && process.romajiMons && process.romajiMoves) {
			label = process.romajiMons.find((m) => m.name.toLowerCase() === mon.name.toLowerCase())?.trademark ?? mon.name;
		}
		if (mon.name === battle.p1.active[0]?.name)
			switch_buttons.push({ type: 2, custom_id: mon.name, label, style: mon.fainted ? 2 : 1, disabled: true });
		else switch_buttons.push({ type: 2, custom_id: mon.name, label, style: mon.fainted ? 2 : 1, disabled: mon.fainted });
	}

	const components = [
		{ type: 1, components: [switch_buttons[0], switch_buttons[1], switch_buttons[2]] },
		{ type: 1, components: [switch_buttons[3], switch_buttons[4], switch_buttons[5]] },
		...(allowCancel ? [{ type: 1, components: [{ type: 2, custom_id: 'cancel', label: 'Cancel', style: 2 }] }] : [])
	];

	console.log('sending switch embed');
	await updateBattleEmbed(battle, message, user, components);
	console.log('sent switch embed');

	const filter = (i: MessageComponentInteraction) => i.user.id === user.id;
	const collector = message.channel!.createMessageComponentCollector({ filter });

	collector.on('collect', async (i) => {
		collector.stop();
		await i.deferUpdate();

		if (i.customId === 'cancel') {
			await updateBattleEmbed(battle, message, user);
			await moveChoice(streams, battle, message, user);
		} else {
			builder.addChoice(`switch ${i.customId}`);
			const choice = builder.toString();
			await streams.p1.write(choice);
		}
	});
}

async function forfeitBattle(streams: any, interaction: MessageComponentInteraction, battle: Battle, message: Message, user: User): Promise<boolean> {
	await interaction.followUp({
		content: 'Do you wish to forfeit this battle?',
		components: [
			{
				type: 1,
				components: [
					{
						type: 2,
						custom_id: 'yes',
						label: 'Yes',
						style: 3
					},
					{
						type: 2,
						custom_id: 'no',
						label: 'No',
						style: 4
					}
				]
			}
		],
		ephemeral: true
	});

	const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id;
	const collector = interaction.channel!.createMessageComponentCollector({ filter });

	let choice = false;

	collector.on('collect', async (i) => {
		collector.stop();
		if (i.customId === 'yes') {
			choice = true;
			process.battlelog.push(`${interaction.user.username} forfeited.`);
			await streams.omniscient.write(`>forcewin p2`);
			// @ts-ignore delete ephemeral message
			await interaction.client.api.webhooks(i.client.user!.id, i.token).messages('@original').delete();
		}
		if (i.customId === 'no') {
			await updateBattleEmbed(battle, message, user);
			// @ts-ignore delete ephemeral message
			await interaction.client.api.webhooks(i.client.user!.id, i.token).messages('@original').delete();
		}
	});

	return choice;
}

export async function activateGimmick(gimmick: string, streams: any, battle: Battle, message: Message, user: User) {
	if (gimmick === 'max') {
		// use .maxMoves to replace the move buttons with max move buttons
		const components: any = [
			{
				type: 1,
				components: [
					{
						type: 2,
						custom_id: battle.p1.active[0]?.maxMoves?.[0].id,
						label: `${Dex.moves.get(battle.p1.active[0]?.maxMoves?.[0].id)?.name} ${
							// @ts-ignore typings are wrong
							battle.p1.active[0]?.moveSlots[0]?.pp
							// @ts-ignore typings are wrong
						}/${battle.p1.active[0]?.moveSlots[0]?.maxpp} PP`,
						style: 1
					},
					{
						type: 2,
						custom_id: battle.p1.active[0]?.maxMoves?.[1].id,
						label: `${Dex.moves.get(battle.p1.active[0]?.maxMoves?.[1].id)?.name} ${
							// @ts-ignore typings are wrong
							battle.p1.active[0]?.moveSlots[1]?.pp
							// @ts-ignore typings are wrong
						}/${battle.p1.active[0]?.moveSlots[1]?.maxpp} PP`,
						style: 1
					}
				]
			},
			{
				type: 1,
				components: [
					{
						type: 2,
						custom_id: battle.p1.active[0]?.maxMoves?.[2].id,
						label: `${Dex.moves.get(battle.p1.active[0]?.maxMoves?.[2].id)?.name} ${
							// @ts-ignore typings are wrong
							battle.p1.active[0]?.moveSlots[2]?.pp
							// @ts-ignore typings are wrong
						}/${battle.p1.active[0]?.moveSlots[2]?.maxpp} PP`,
						style: 1
					},
					{
						type: 2,
						custom_id: battle.p1.active[0]?.maxMoves?.[3].id,
						label: `${Dex.moves.get(battle.p1.active[0]?.maxMoves?.[3].id)?.name} ${
							// @ts-ignore typings are wrong
							battle.p1.active[0]?.moveSlots[3]?.pp
							// @ts-ignore typings are wrong
						}/${battle.p1.active[0]?.moveSlots[3]?.maxpp} PP`,
						style: 1
					},
					{ type: 2, custom_id: 'cancel', label: 'Cancel', style: 2 }
				]
			}
		];

		await updateBattleEmbed(battle, message, user, components);
		await moveChoice(streams, battle, message, user);
	}
}
