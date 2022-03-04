import type { Battle } from '@pkmn/client';
import { Formatters, MessageComponentInteraction } from 'discord.js';
import { Sprites } from '@pkmn/img';
import { ChoiceBuilder } from '@pkmn/view';

export async function updateBattleEmbed(battle: Battle, interaction: MessageComponentInteraction, battlelog: string[]) {
	const activemon = battle.p1.active[0];
	const opponent = battle.p1.foe.active[0];

	const { url: activesprite } = Sprites.getPokemon(activemon?.species.name as string, { gen: 'ani', shiny: activemon?.shiny, side: 'p1' });
	const { url: opponentprite } = Sprites.getPokemon(opponent?.species.name as string, { gen: 'ani', shiny: opponent?.shiny, side: 'p2' });

	const log = battlelog.join('');
	const embeds = [
		{
			author: { name: `${opponent?.name} | ${opponent?.hp}/${opponent?.maxhp} HP`, iconURL: interaction.client.user?.displayAvatarURL() },
			thumbnail: { url: opponentprite },
			color: '0x5865F2',
			description: Formatters.codeBlock(log),
			image: { url: activesprite },
			footer: { text: `${activemon?.name} | ${activemon?.hp}/${activemon?.maxhp} HP`, iconURL: interaction.user?.displayAvatarURL() }
		}
	] as any;

	const components = [
		{
			type: 1,
			components: [
				{
					type: 2,
					custom_id: activemon?.moveSlots[0]?.id,
					label: activemon?.moveSlots[0]?.name,
					style: 1
				},
				{
					type: 2,
					custom_id: activemon?.moveSlots[1]?.id,
					label: activemon?.moveSlots[1]?.name,
					style: 1
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
					custom_id: activemon?.moveSlots[2]?.id,
					label: activemon?.moveSlots[2]?.name,
					style: 1
				},
				{
					type: 2,
					custom_id: activemon?.moveSlots[3]?.id,
					label: activemon?.moveSlots[3]?.name,
					style: 1
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

	await interaction.editReply({ embeds, components, files: [] });
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function moveChoice(streams: any, battle: Battle, interaction: MessageComponentInteraction) {
	const activemon = battle.p1.active[0];
	const builder = new ChoiceBuilder(battle.request!);

	const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id;
	const collector = interaction.channel!.createMessageComponentCollector({ filter });

	collector.on('collect', async (i) => {
		await i.deferUpdate();
		console.log(activemon?.moves);
		console.log(activemon?.moves.includes(i.customId as any));
		if (activemon?.moves.includes(i.customId as any)) {
			console.log('test');
			builder.addChoice(`move ${i.customId}`);
			const choice = builder.toString();
			streams.p1.write(choice);
		}
		if (i.customId === 'switch') {
			// switch
		}
		if (i.customId === 'forfeit') {
			// forfeit
		}
	});
}
