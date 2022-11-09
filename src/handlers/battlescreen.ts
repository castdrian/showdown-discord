import type { Battle, Pokemon } from '@pkmn/client';
import type {
	Message,
	MessageComponentInteraction,
	User,
	ActionRowData,
	APIActionRowComponent,
	APIMessageActionRowComponent,
	JSONEncodable,
	MessageActionRowComponentBuilder,
	MessageActionRowComponentData
} from 'discord.js';
import { Sprites } from '@pkmn/img';
import { ChoiceBuilder } from '@pkmn/view';
import { formatBattleLog, generateEffectInfo, generateSideState } from '#util/ansi';
import type { MoveName } from '@pkmn/dex';
import { Dex } from '@pkmn/sim';
import { fixCustomId, getCustomId } from '#util/functions';
import { maxSprite } from '#util/canvas';
import { typeEmotes } from '#constants/emotes';
import type { RomajiMon, RomajiMove } from 'pkmn-romaji';
import { cache } from '#util/cache';

export async function updateBattleEmbed(
	battle: Battle,
	message: Message,
	extComponents?: (
		| JSONEncodable<APIActionRowComponent<APIMessageActionRowComponent>>
		| ActionRowData<MessageActionRowComponentData | MessageActionRowComponentBuilder>
		| APIActionRowComponent<APIMessageActionRowComponent>
	)[]
): Promise<void> {
	if (extComponents) {
		extComponents = fixCustomId(extComponents);
	}

	const romaji = await cache.get('romaji');
	const romajiMons: RomajiMon[] = await cache.get('romajimons')!;
	const romajiMoves: RomajiMove[] = await cache.get('romajimoves')!;
	const isMax = await cache.get('isMax');
	const battlelog: string[] = cache.get('battlelog')!;

	if (romaji && romajiMons && romajiMoves) {
		// overwrite active mons and moves with romaji
		for (const mon of battle.p1.active) {
			if (mon) {
				mon.name = romajiMons.find((m) => m.name.toLowerCase() === mon.name.toLowerCase())?.trademark ?? mon.name;
				for (const move of mon.moveSlots) {
					move.name =
						(romajiMoves.find((m) => m.move.replace(/\s/g, '').toLowerCase() === move.name.replace(/\s/g, '').toLowerCase())
							?.romaji as MoveName) ?? move.name;
				}
			}
		}

		// repeat for foe
		for (const mon of battle.p1.foe.active) {
			if (mon) {
				mon.name = romajiMons.find((m) => m.name.toLowerCase() === mon.name.toLowerCase())?.trademark ?? mon.name;
				for (const move of mon.moveSlots) {
					move.name =
						(romajiMoves.find((m) => m.move.replace(/\s/g, '').toLowerCase() === move.name.replace(/\s/g, '').toLowerCase())
							?.romaji as MoveName) ?? move.name;
				}
			}
		}
	}

	const activemon = battle.p1.active[0] ?? battle.p1.lastPokemon;
	const opponent = battle.p1.foe.active[0] ?? battle.p2.lastPokemon;

	const {
		url: activesprite,
		w: activewidth,
		h: activeheight
	} = Sprites.getPokemon(activemon?.baseSpeciesForme as string, { gen: 'ani', shiny: activemon?.shiny, side: 'p1' });
	const { url: opponentsprite } = Sprites.getPokemon(opponent?.baseSpeciesForme as string, {
		gen: 'ani',
		shiny: opponent?.shiny,
		side: 'p2'
	});

	const { avatar1, avatar2 } = cache.get('avatars') as any;

	const embeds = [
		{
			author: {
				name: battle.p2.name,
				icon_url: avatar2
			},
			thumbnail: { url: opponentsprite },
			color: 0x5865f2,
			description: `${generateSideState(battle.p2)}\n${formatBattleLog(battlelog, battle)}\n${generateSideState(battle.p1)}`,
			// when isMax is true take 'max.gif' from the messageattachment that maxSprite() returns
			// only show image if active mon is not fainted, if it is fainted image is undefined
			image: activemon?.fainted ? undefined : { url: isMax ? 'attachment://max.gif' : activesprite },
			footer: {
				text: battle.p1.name,
				icon_url: avatar1
			}
		}
	] as any;

	let components = generateMoveButtons(activemon!);
	if (components) {
		components = fixCustomId(components) as any;
	}
	let files: any = [];

	// if process.isMax is true, overwrite the components with the result of maxMoves(battle) and add the switch and forfeit buttons into the components and run them through fixCustomId
	if (isMax) {
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
		// add row 3 with info button
		components.push({
			type: 1,
			components: [
				{
					type: 2,
					custom_id: 'info',
					emoji: '<:normalball:1037794399347822622>',
					style: 2
				}
			]
		});
		components = fixCustomId(components) as any;

		// overwrite the files with the result of maxSprite()
		let file = cache.get('maxsprite');
		if (!file) {
			// if maxSpriteString is undefined, run maxSprite() and set base64 string to cache
			const attachment = await maxSprite(activesprite, activewidth, activeheight);
			cache.set('maxsprite', attachment);
			file = attachment;
		}
		files = [file];
	}

	await message.edit({ embeds, components: extComponents ?? components, files });
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function moveChoice(streams: any, battle: Battle, message: Message, user: User, gimmick?: string) {
	const activemon = battle.p1.active[0];
	const builder = new ChoiceBuilder(battle.request!);

	const filter = (i: any) => i.user.id === user.id;
	const collector = message!.createMessageComponentCollector({ filter });

	collector.on('collect', async (i: MessageComponentInteraction) => {
		await i.deferUpdate();
		// retrieve the original custom id
		const customId = getCustomId(i.customId);

		if (activemon?.moves.includes(customId as any)) {
			collector.stop();
			if (gimmick) builder.addChoice(`move ${customId} ${gimmick}`);
			else builder.addChoice(`move ${customId}`);
			const choice = builder.toString();
			streams.p1.write(choice);

			const move = Dex.moves.get(customId as any);

			if (move.selfSwitch && !activemon?.trapped) {
				await switchChoice(streams, battle, message, user, false);
			} else await updateBattleEmbed(battle, message);
		}
		if (customId === 'switch') {
			collector.stop();
			await switchChoice(streams, battle, message, user, true);
		}
		if (customId === 'max' || customId === 'mega' || customId === 'zmove') {
			collector.stop();
			await activateGimmick(customId, streams, battle, message, user);
		}
		if (customId === 'info') {
			await i.followUp({ content: generateEffectInfo(battle) ?? 'No active battle effects.', ephemeral: true });
		}
		if (customId === 'cancel') {
			collector.stop();
			await updateBattleEmbed(battle, message);
			await moveChoice(streams, battle, message, user);
		}
		if (customId === 'forfeit') {
			const forfeit = await forfeitBattle(streams, i, battle, message);
			if (forfeit) collector.stop();
		}
	});
}

export async function switchChoice(streams: any, battle: Battle, message: Message, user: User, allowCancel = false) {
	const { team } = battle.p1;
	const builder = new ChoiceBuilder(battle.request!);

	const romaji = await cache.get('romaji');
	const romajiMons: RomajiMon[] = await cache.get('romajimons')!;
	const romajiMoves: RomajiMove[] = await cache.get('romajimoves')!;

	const switch_buttons = [];
	for (const mon of team) {
		let label = mon.name;
		if (romaji && romajiMons && romajiMoves) {
			label = romajiMons.find((m) => m.name.toLowerCase() === mon.name.toLowerCase())?.trademark ?? mon.name;
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

	await updateBattleEmbed(battle, message, components);

	const filter = (i: any) => i.user.id === user.id;
	const collector = message!.createMessageComponentCollector({ filter });

	collector.on('collect', async (i: MessageComponentInteraction) => {
		await i.deferUpdate();
		// retrieve the original custom id
		const customId = getCustomId(i.customId);

		if (customId === 'cancel') {
			collector.stop();
			await updateBattleEmbed(battle, message);
			await moveChoice(streams, battle, message, user);
		} else {
			collector.stop();
			builder.addChoice(`switch ${customId}`);
			const choice = builder.toString();
			await streams.p1.write(choice);
		}
	});
}

async function forfeitBattle(streams: any, interaction: MessageComponentInteraction, battle: Battle, message: Message): Promise<boolean> {
	const msg = (await interaction.followUp({
		content: 'Do you wish to forfeit this battle?',
		components: [
			{
				type: 1,
				components: [
					{
						type: 2,
						custom_id: 'yes',
						label: 'Yes',
						style: 4
					},
					{
						type: 2,
						custom_id: 'no',
						label: 'No',
						style: 3
					}
				]
			}
		],
		ephemeral: true
	})) as Message;

	const filter = (i: any) => i.user.id === interaction.user.id;
	const collector = msg!.createMessageComponentCollector({ filter });

	let choice = false;

	collector.on('collect', async (i: MessageComponentInteraction) => {
		collector.stop();
		// retrieve the original custom id
		const customId = getCustomId(i.customId);

		if (customId === 'yes') {
			choice = true;
			const battlelog: string[] = cache.get('battlelog')!;
			if (battlelog) {
				battlelog.push(`${interaction.user.username} forfeited.`);
				cache.set('battlelog', battlelog);
			}
			await streams.omniscient.write(`>forcewin p2`);
			await interaction.webhook.deleteMessage(msg);
		}
		if (customId === 'no') {
			await updateBattleEmbed(battle, message);
			await interaction.webhook.deleteMessage(msg);
		}
	});

	return choice;
}

async function activateGimmick(gimmick: string, streams: any, battle: Battle, message: Message, user: User) {
	if (gimmick === 'max') {
		// const components is the result of maxMoves(battle) plus a cancel button { type: 2, custom_id: 'cancel', label: 'Cancel', style: 2 }
		const components = await maxMoves(battle);
		// now insert the cancel button at row 2
		components[1].components.push({ type: 2, custom_id: 'cancel', label: 'Cancel', style: 2 });

		await updateBattleEmbed(battle, message, await components);
		await moveChoice(streams, battle, message, user, gimmick);
	}
	if (gimmick === 'mega') {
		const components = await generateMoveButtons(battle.p1.active[0]!);
		// now insert the cancel button at row 2
		components[1].components.push({ type: 2, custom_id: 'cancel', label: 'Cancel', style: 2 });
		// remove row 3 (the mega button) which is at index 2
		components.splice(2, 1);

		await updateBattleEmbed(battle, message, await components);
		await moveChoice(streams, battle, message, user, gimmick);
	}
	if (gimmick === 'zmove') {
		const components = await zMoves(battle);
		// now insert the cancel button at row 2
		components[1].components.push({ type: 2, custom_id: 'cancel', label: 'Cancel', style: 2 });
		// remove row 3 (the zmove button) which is at index 2
		components.splice(2, 1);

		await updateBattleEmbed(battle, message, await components);
		await moveChoice(streams, battle, message, user, gimmick);
	}
}

function generateMoveButtons(activemon: Pokemon): any {
	// get the type of each move
	const moveTypes = activemon.moves.map((move) => {
		const moveType = Dex.moves.get(move)?.type;
		return moveType;
	});
	// get emojis from constants
	const type1 = moveTypes[0] ? typeEmotes[moveTypes[0].toLowerCase()] : undefined;
	const type2 = moveTypes[1] ? typeEmotes[moveTypes[1].toLowerCase()] : undefined;
	const type3 = moveTypes[2] ? typeEmotes[moveTypes[2].toLowerCase()] : undefined;
	const type4 = moveTypes[3] ? typeEmotes[moveTypes[3].toLowerCase()] : undefined;

	const romaji = cache.get('romaji');

	return [
		{
			type: 1,
			components: [
				{
					type: 2,
					custom_id: activemon?.moveSlots[0]?.id ?? 'movea',
					// @ts-ignore pp props missing from types
					label: `${activemon?.moveSlots[0]?.name} ${activemon?.moveSlots[0]?.pp}/${activemon?.moveSlots[0]?.maxpp} PP`,
					style: 1,
					emoji: type1,
					// @ts-ignore disbaled prop missing from types
					disabled: activemon?.moveSlots[0]?.disabled
				},
				{
					type: 2,
					custom_id: activemon?.moveSlots[1]?.id ?? 'moveb',
					// @ts-ignore pp props missing from types
					label: `${activemon?.moveSlots[1]?.name} ${activemon?.moveSlots[1]?.pp}/${activemon?.moveSlots[1]?.maxpp} PP`,
					style: 1,
					emoji: type2,
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
					emoji: type3,
					// @ts-ignore disbaled prop missing from types
					disabled: activemon?.moveSlots[2]?.disabled
				},
				{
					type: 2,
					custom_id: activemon?.moveSlots[3]?.id ?? 'moved',
					// @ts-ignore pp props missing from types
					label: `${activemon?.moveSlots[3]?.name} ${activemon?.moveSlots[3]?.pp}/${activemon?.moveSlots[3]?.maxpp} PP`,
					style: 1,
					emoji: type4,
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
								label: romaji
									? activemon?.canGigantamax
										? 'Kyodaimax'
										: 'Daimax'
									: activemon?.canGigantamax
									? 'Gigantamax'
									: 'Dynamax',
								style: 2,
								emoji: '<:dmax:1038101514142617650>',
								disabled: !activemon?.canDynamax && !activemon?.canGigantamax
							}
					  ]
					: []),
				...(activemon?.canMegaEvo
					? [
							{
								type: 2,
								custom_id: 'mega',
								label: romaji ? 'Mega Shinka' : 'Mega Evolve',
								style: 2,
								emoji: '<:megaevo:1038102161122414602>',
								disabled: !activemon?.canMegaEvo
							}
					  ]
					: []),
				...(activemon?.zMoves?.length
					? [
							{
								type: 2,
								custom_id: 'zmove',
								label: romaji ? 'Z Waza' : 'Z-Move',
								style: 2,
								emoji: '<:zpower:1038102607027261540>',
								disabled: !activemon?.zMoves?.length
							}
					  ]
					: []),
				{
					type: 2,
					custom_id: 'info',
					emoji: '<:normalball:1037794399347822622>',
					style: 2
				}
			]
		}
	];
}

function maxMoves(battle: Battle): any {
	// get the type of each move
	const moveTypes = battle.p1.active[0]?.moves.map((move) => {
		const moveType = Dex.moves.get(move)?.type;
		return moveType;
	});
	// get emojis from constants
	const type1 = moveTypes?.[0] ? typeEmotes[moveTypes[0].toLowerCase()] : undefined;
	const type2 = moveTypes?.[1] ? typeEmotes[moveTypes[1].toLowerCase()] : undefined;
	const type3 = moveTypes?.[2] ? typeEmotes[moveTypes[2].toLowerCase()] : undefined;
	const type4 = moveTypes?.[3] ? typeEmotes[moveTypes[3].toLowerCase()] : undefined;

	const romaji = cache.get('romaji');
	const romajiMoves: RomajiMove[] = cache.get('romajimoves')!;

	return [
		{
			type: 1,
			components: [
				{
					type: 2,
					custom_id: battle.p1.active[0]?.moveSlots?.[0].id,
					label: `${
						romaji
							? romajiMoves.find(
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
					style: 1,
					emoji: type1
				},
				{
					type: 2,
					custom_id: battle.p1.active[0]?.moveSlots?.[1].id,
					label: `${
						romaji
							? romajiMoves.find(
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
					style: 1,
					emoji: type2
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
						romaji
							? romajiMoves.find(
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
					style: 1,
					emoji: type3
				},
				{
					type: 2,
					custom_id: battle.p1.active[0]?.moveSlots?.[3].id,
					label: `${
						romaji
							? romajiMoves.find(
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
					style: 1,
					emoji: type4
				}
			]
		}
	];
}

function zMoves(battle: Battle): any {
	// get the type of each move
	const moveTypes = battle.p1.active[0]?.moves.map((move) => {
		const moveType = Dex.moves.get(move)?.type;
		return moveType;
	});
	// get emojis from constants
	const type1 = moveTypes?.[0] ? typeEmotes[moveTypes[0].toLowerCase()] : undefined;
	const type2 = moveTypes?.[1] ? typeEmotes[moveTypes[1].toLowerCase()] : undefined;
	const type3 = moveTypes?.[2] ? typeEmotes[moveTypes[2].toLowerCase()] : undefined;
	const type4 = moveTypes?.[3] ? typeEmotes[moveTypes[3].toLowerCase()] : undefined;

	const romaji = cache.get('romaji');
	const romajiMoves: RomajiMove[] = cache.get('romajimoves')!;

	if (battle.p1.active[0]?.zMoves?.length) {
		// replace entries in battle.p1.active[0]?.zMoves with the moveSlot data if the index is null
		for (let i = 0; i < battle.p1.active[0]?.zMoves?.length; i++) {
			if (battle.p1.active[0]?.zMoves?.[i] === null) {
				// @ts-ignore lol
				battle.p1.active[0].zMoves[i] = battle.p1.active[0]?.moveSlots[i];
			}
		}

		return [
			{
				type: 1,
				components: [
					{
						type: 2,
						custom_id: battle.p1.active[0]?.moveSlots?.[0].id,
						label: `${
							romaji
								? romajiMoves.find(
										(m) =>
											m.move.replace(/\s/g, '').toLowerCase() ===
											battle.p1.active[0]?.zMoves?.[0]?.name.replace(/\s/g, '').toLowerCase()
								  )?.romaji ?? battle.p1.active[0]?.zMoves?.[0]?.name
								: battle.p1.active[0]?.zMoves?.[0]?.name
						} ${
							// @ts-ignore typings are wrong
							battle.p1.active[0]?.moveSlots[0]?.pp
							// @ts-ignore typings are wrong
						}/${battle.p1.active[0]?.moveSlots[0]?.maxpp} PP`,
						style: 1,
						emoji: type1
					},
					{
						type: 2,
						custom_id: battle.p1.active[0]?.moveSlots?.[1].id,
						label: `${
							romaji
								? romajiMoves.find(
										(m) =>
											m.move.replace(/\s/g, '').toLowerCase() ===
											battle.p1.active[0]?.zMoves?.[1]?.name.replace(/\s/g, '').toLowerCase()
								  )?.romaji ?? battle.p1.active[0]?.zMoves?.[1]?.name
								: battle.p1.active[0]?.zMoves?.[1]?.name
						} ${
							// @ts-ignore typings are wrong
							battle.p1.active[0]?.moveSlots[1]?.pp
							// @ts-ignore typings are wrong
						}/${battle.p1.active[0]?.moveSlots[1]?.maxpp} PP`,
						style: 1,
						emoji: type2
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
							romaji
								? romajiMoves.find(
										(m) =>
											m.move.replace(/\s/g, '').toLowerCase() ===
											battle.p1.active[0]?.zMoves?.[2]?.name.replace(/\s/g, '').toLowerCase()
								  )?.romaji ?? battle.p1.active[0]?.zMoves?.[2]?.name
								: battle.p1.active[0]?.zMoves?.[2]?.name
						} ${
							// @ts-ignore typings are wrong
							battle.p1.active[0]?.moveSlots[2]?.pp
							// @ts-ignore typings are wrong
						}/${battle.p1.active[0]?.moveSlots[2]?.maxpp} PP`,
						style: 1,
						emoji: type3
					},
					{
						type: 2,
						custom_id: battle.p1.active[0]?.moveSlots?.[3].id,
						label: `${
							romaji
								? romajiMoves.find(
										(m) =>
											m.move.replace(/\s/g, '').toLowerCase() ===
											battle.p1.active[0]?.zMoves?.[3]?.name.replace(/\s/g, '').toLowerCase()
								  )?.romaji ?? battle.p1.active[0]?.zMoves?.[3]?.name
								: battle.p1.active[0]?.zMoves?.[3]?.name
						} ${
							// @ts-ignore typings are wrong
							battle.p1.active[0]?.moveSlots[3]?.pp
							// @ts-ignore typings are wrong
						}/${battle.p1.active[0]?.moveSlots[3]?.maxpp} PP`,
						style: 1,
						emoji: type4
					}
				]
			}
		];
	}
}
