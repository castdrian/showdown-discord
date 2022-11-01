import type { Battle } from '@pkmn/client';
import type { BaseMessageComponentOptions, Message, MessageActionRow, MessageActionRowOptions, MessageComponentInteraction, User } from 'discord.js';
import { Sprites } from '@pkmn/img';
import { ChoiceBuilder } from '@pkmn/view';
import { formatBattleLog } from '#util/ansi';
import type { MoveName } from '@pkmn/dex';
import { Dex } from '@pkmn/sim';
import { fixCustomId, getCustomId } from '#util/functions';

export async function updateBattleEmbed(
	battle: Battle,
	message: Message,
	user: User,
	extComponents?: (MessageActionRow | (Required<BaseMessageComponentOptions> & MessageActionRowOptions))[]
): Promise<void> {
	if (extComponents) {
		extComponents = fixCustomId(extComponents);
	}

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

	const {
		url: activesprite,
		w: activewidth,
		h: activeheight
	} = Sprites.getPokemon(activemon?.species.name as string, { gen: 'ani', shiny: activemon?.shiny, side: 'p1' });
	const { url: opponentsprite } = Sprites.getPokemon(opponent?.species.name as string, {
		gen: 'ani',
		shiny: opponent?.shiny,
		side: 'p2'
	});

	const embeds = [
		{
			author: {
				name: `${opponent?.name} | ${opponent?.hp}/${opponent?.maxhp} HP ${opponent?.status ? `| ${opponent.status.toUpperCase()}` : ''}`,
				iconURL: message.client.user?.displayAvatarURL()
			},
			thumbnail: { url: opponentsprite },
			color: '0x5865F2',
			description: formatBattleLog(process.battlelog, battle),
			// change width and height to 1.5x the original when process.isMax is true
			image: {
				url: activesprite,
				width: process.isMax ? activewidth * 1.5 : activewidth,
				height: process.isMax ? activeheight * 1.5 : activeheight
			},
			footer: {
				text: `${activemon?.name} | ${activemon?.hp}/${activemon?.maxhp} HP ${
					activemon?.status ? `| ${activemon.status.toUpperCase()}` : ''
				}`,
				iconURL: user.displayAvatarURL()
			}
		}
	] as any;

	let components = [
		{
			type: 1,
			components: [
				{
					type: 2,
					custom_id: activemon?.moveSlots[0]?.id ?? 'movea',
					// @ts-ignore pp props missing from types
					label: `${activemon?.moveSlots[0]?.name} ${activemon?.moveSlots[0]?.pp}/${activemon?.moveSlots[0]?.maxpp} PP`,
					style: 1,
					// @ts-ignore disbaled prop missing from types
					disabled: activemon?.moveSlots[0]?.disabled
				},
				{
					type: 2,
					custom_id: activemon?.moveSlots[1]?.id ?? 'moveb',
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
					custom_id: activemon?.moveSlots[2]?.id ?? 'movec',
					// @ts-ignore pp props missing from types
					label: `${activemon?.moveSlots[2]?.name} ${activemon?.moveSlots[2]?.pp}/${activemon?.moveSlots[2]?.maxpp} PP`,
					style: 1,
					// @ts-ignore disbaled prop missing from types
					disabled: activemon?.moveSlots[2]?.disabled
				},
				{
					type: 2,
					custom_id: activemon?.moveSlots[3]?.id ?? 'moved',
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
							// if can dynamax or gigantamax, add a button for that, if can gigantamax label it as such otherwise label it as dynamax, also if romaji is available use that instead of the name
							...(activemon?.canDynamax || activemon?.canGigantamax
								? [
										{
											type: 2,
											custom_id: 'max',
											label: process.romaji
												? activemon?.canGigantamax
													? 'Kyodaimax'
													: 'Daimax'
												: activemon?.canGigantamax
												? 'Gigantamax'
												: 'Dynamax',
											style: 2,
											disabled: !activemon?.canDynamax && !activemon?.canGigantamax
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
	if (components) {
		components = fixCustomId(components) as any;
	}

	// if process.isMax is true, overwrite the components with the result of maxMoves(battle) and add the switch and forfeit buttons into the components and run them through fixCustomId
	if (process.isMax) {
		components = maxMoves(battle);
		// add the switch button to the first row and the forfeit button to the second row
		components[0].components.push({
			type: 2,
			custom_id: 'switch',
			label: 'Switch',
			style: 3,
			disabled: activemon?.trapped
		});
		components[1].components.push({
			type: 2,
			custom_id: 'forfeit',
			label: 'Forfeit',
			style: 4
		});
		components = fixCustomId(components) as any;
	}

	await message.edit({ embeds, components: extComponents ?? components, files: [] });
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function moveChoice(streams: any, battle: Battle, message: Message, user: User, gimmick?: string) {
	const activemon = battle.p1.active[0];
	const builder = new ChoiceBuilder(battle.request!);

	const filter = (i: MessageComponentInteraction) => i.user.id === user.id;
	const collector = message.channel!.createMessageComponentCollector({ filter });

	collector.on('collect', async (i) => {
		await i.deferUpdate();
		// retrieve the original custom id
		const customId = getCustomId(i.customId);
		console.log(customId);
		if (activemon?.moves.includes(customId as any)) {
			collector.stop();
			if (gimmick) builder.addChoice(`move ${customId} ${gimmick}`);
			else builder.addChoice(`move ${customId}`);
			const choice = builder.toString();
			streams.p1.write(choice);
			await updateBattleEmbed(battle, message, user);
		}
		if (customId === 'switch') {
			collector.stop();
			await switchChoice(streams, battle, message, user, true);
		}
		if (customId === 'max' || customId === 'mega' || customId === 'zmove') {
			collector.stop();
			await activateGimmick(customId, streams, battle, message, user);
		}
		if (customId === 'cancel') {
			collector.stop();
			await updateBattleEmbed(battle, message, user);
			await moveChoice(streams, battle, message, user);
		}
		if (customId === 'forfeit') {
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
		await i.deferUpdate();
		// retrieve the original custom id
		const customId = getCustomId(i.customId);

		if (customId === 'cancel') {
			collector.stop();
			await updateBattleEmbed(battle, message, user);
			await moveChoice(streams, battle, message, user);
		} else {
			collector.stop();
			builder.addChoice(`switch ${customId}`);
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
		// retrieve the original custom id
		const customId = getCustomId(i.customId);

		if (customId === 'yes') {
			choice = true;
			process.battlelog.push(`${interaction.user.username} forfeited.`);
			await streams.omniscient.write(`>forcewin p2`);
			// @ts-ignore delete ephemeral message
			await interaction.client.api.webhooks(i.client.user!.id, i.token).messages('@original').delete();
		}
		if (customId === 'no') {
			await updateBattleEmbed(battle, message, user);
			// @ts-ignore delete ephemeral message
			await interaction.client.api.webhooks(i.client.user!.id, i.token).messages('@original').delete();
		}
	});

	return choice;
}

async function activateGimmick(gimmick: string, streams: any, battle: Battle, message: Message, user: User) {
	if (gimmick === 'max') {
		// const components is the result of maxMoves(battle) plus a cancel button { type: 2, custom_id: 'cancel', label: 'Cancel', style: 2 }
		const components = maxMoves(battle);
		// now insert the cancel button at row 2
		components[1].components.push({ type: 2, custom_id: 'cancel', label: 'Cancel', style: 2 });

		await updateBattleEmbed(battle, message, user, components);
		await moveChoice(streams, battle, message, user, gimmick);
	}
}

function maxMoves(battle: Battle): any {
	return [
		{
			type: 1,
			components: [
				{
					type: 2,
					custom_id: battle.p1.active[0]?.moveSlots?.[0].id,
					label: `${
						process.romaji
							? process.romajiMoves.find(
									(m) =>
										m.move.replace(/\s/g, '').toLowerCase() ===
										Dex.moves.get(battle.p1.active[0]?.maxMoves?.[0].id)?.name.replace(/\s/g, '').toLowerCase()
							  )?.romaji ?? Dex.moves.get(battle.p1.active[0]?.maxMoves?.[0].id).name
							: Dex.moves.get(battle.p1.active[0]?.maxMoves?.[0].id).name
					} ${
						// @ts-ignore typings are wrong
						battle.p1.active[0]?.moveSlots[0]?.pp
						// @ts-ignore typings are wrong
					}/${battle.p1.active[0]?.moveSlots[0]?.maxpp} PP`,
					style: 1
				},
				{
					type: 2,
					custom_id: battle.p1.active[0]?.moveSlots?.[1].id,
					label: `${
						process.romaji
							? process.romajiMoves.find(
									(m) =>
										m.move.replace(/\s/g, '').toLowerCase() ===
										Dex.moves.get(battle.p1.active[0]?.maxMoves?.[1].id)?.name.replace(/\s/g, '').toLowerCase()
							  )?.romaji ?? Dex.moves.get(battle.p1.active[0]?.maxMoves?.[1].id).name
							: Dex.moves.get(battle.p1.active[0]?.maxMoves?.[1].id).name
					} ${
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
					custom_id: battle.p1.active[0]?.moveSlots?.[2].id,
					label: `${
						process.romaji
							? process.romajiMoves.find(
									(m) =>
										m.move.replace(/\s/g, '').toLowerCase() ===
										Dex.moves.get(battle.p1.active[0]?.maxMoves?.[2].id)?.name.replace(/\s/g, '').toLowerCase()
							  )?.romaji ?? Dex.moves.get(battle.p1.active[0]?.maxMoves?.[2].id).name
							: Dex.moves.get(battle.p1.active[0]?.maxMoves?.[2].id).name
					} ${
						// @ts-ignore typings are wrong
						battle.p1.active[0]?.moveSlots[2]?.pp
						// @ts-ignore typings are wrong
					}/${battle.p1.active[0]?.moveSlots[2]?.maxpp} PP`,
					style: 1
				},
				{
					type: 2,
					custom_id: battle.p1.active[0]?.moveSlots?.[3].id,
					label: `${
						process.romaji
							? process.romajiMoves.find(
									(m) =>
										m.move.replace(/\s/g, '').toLowerCase() ===
										Dex.moves.get(battle.p1.active[0]?.maxMoves?.[3].id)?.name.replace(/\s/g, '').toLowerCase()
							  )?.romaji ?? Dex.moves.get(battle.p1.active[0]?.maxMoves?.[3].id).name
							: Dex.moves.get(battle.p1.active[0]?.maxMoves?.[3].id).name
					} ${
						// @ts-ignore typings are wrong
						battle.p1.active[0]?.moveSlots[3]?.pp
						// @ts-ignore typings are wrong
					}/${battle.p1.active[0]?.moveSlots[3]?.maxpp} PP`,
					style: 1
				}
			]
		}
	];
}
