import type { Battle } from '@pkmn/client';
import type { CommandInteraction } from 'discord.js';
import { Sprites } from '@pkmn/img';

export async function updateBattleEmbed(battle: Battle, interaction: CommandInteraction) {
	const activemon = battle.p1.active[0];
	const opponent = battle.p1.foe.active[0];

	const { url: activesprite } = Sprites.getPokemon(activemon?.species.name as string, { gen: 'ani', shiny: activemon?.shiny, side: 'p1' });
	const { url: opponentprite } = Sprites.getPokemon(opponent?.species.name as string, { gen: 'ani', shiny: opponent?.shiny, side: 'p2' });

	const embeds = [
		{
			author: { name: `${opponent?.name} | ${opponent?.hp}/${opponent?.maxhp} HP`, iconURL: interaction.client.user?.displayAvatarURL() },
			thumbnail: { url: opponentprite },
			description: `\`\`\`<battle log here>\`\`\``,
			color: '0x5865F2',
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
