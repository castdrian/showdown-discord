import type { Battle, Pokemon } from '@pkmn/client';
import { Formatters, Message, MessageComponentInteraction, User } from 'discord.js';
import { Sprites } from '@pkmn/img';
import { ChoiceBuilder } from '@pkmn/view';

export async function updateBattleEmbed(battle: Battle, message: Message, user: User, switchmon?: Pokemon) {
	const activemon = switchmon ?? battle.p1.active[0];
	const opponent = battle.p1.foe.active[0];

	const { url: activesprite } = Sprites.getPokemon(activemon?.species.name as string, { gen: 'ani', shiny: activemon?.shiny, side: 'p1' });
	const { url: opponentprite } = Sprites.getPokemon(opponent?.species.name as string, { gen: 'ani', shiny: opponent?.shiny, side: 'p2' });

	// filter out lines that contain "Showdown! AI withdrew" because somehow it's being sent on sending out a mon
	const battlelog = process.battlelog.filter((line) => !line.includes('Showdown! AI withdrew'));

	// cut down log to last 10 lines
	const log = battlelog.slice(-10).join('\n');

	const embeds = [
		{
			author: { name: `${opponent?.name} | ${opponent?.hp}/${opponent?.maxhp} HP`, iconURL: message.client.user?.displayAvatarURL() },
			thumbnail: { url: opponentprite },
			color: '0x5865F2',
			description: Formatters.codeBlock(log),
			image: { url: activesprite },
			footer: { text: `${activemon?.name} | ${activemon?.hp}/${activemon?.maxhp} HP`, iconURL: user.displayAvatarURL() }
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
					style: 3
				}
			]
		}
	];

	await message.edit({ embeds, components, files: [] });
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function moveChoice(streams: any, battle: Battle, message: Message, user: User) {
	const activemon = battle.p1.active[0];
	const builder = new ChoiceBuilder(battle.request!);

	const filter = (i: MessageComponentInteraction) => i.user.id === user.id;
	const collector = message.channel!.createMessageComponentCollector({ filter });

	collector.on('collect', async (i) => {
		if (activemon?.moves.includes(i.customId as any)) {
			await i.deferUpdate();
			builder.addChoice(`move ${i.customId}`);
			const choice = builder.toString();
			streams.p1.write(choice);
			collector.stop();
			await updateBattleEmbed(battle, message, user);
		}
		if (i.customId === 'switch') {
			// switch
		}
		if (i.customId === 'forfeit') {
			// forfeit
		}
	});
}

export async function switchChoice(streams: any, battle: Battle, message: Message, user: User) {
	console.log('switching');
	const { team } = battle.p1;
	const builder = new ChoiceBuilder(battle.request!);

	const switch_buttons = [];
	for (const mon of team) switch_buttons.push({ type: 2, custom_id: mon.name, label: mon.name, style: mon.fainted ? 2 : 1, disabled: mon.fainted });

	const components = [
		{ type: 1, components: [switch_buttons[0], switch_buttons[1], switch_buttons[2]] },
		{ type: 1, components: [switch_buttons[3], switch_buttons[4], switch_buttons[5]] }
	];

	console.log('sending switch embed');
	await message.edit({ embeds: [], components });
	console.log('sent switch embed');

	const filter = (i: MessageComponentInteraction) => i.user.id === user.id;
	const collector = message.channel!.createMessageComponentCollector({ filter });

	collector.on('collect', async (i) => {
		collector.stop();
		await i.deferUpdate();

		builder.addChoice(`switch ${i.customId}`);
		const choice = builder.toString();
		await streams.p1.write(choice);
	});
}
