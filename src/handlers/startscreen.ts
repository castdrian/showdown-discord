import { versusScreen } from '#util/canvas';
import type { CommandInteraction, MessageComponentInteraction, MessageSelectOption } from 'discord.js';
import { initiateBattle } from '#handlers/simulation';

export async function startScreen(interaction: CommandInteraction) {
	let formatid = 'gen8randombattle';

	const embeds = [
		{
			title: 'Pokémon Showdown! Battle',
			thumbnail: { url: interaction.client.user?.displayAvatarURL() },
			description: `Format: \`[Gen 8] Random Battle\`\nPlayers: \`${interaction.user.username}\` vs. \`${interaction.client.user?.username}\``,
			color: '0x5865F2',
			image: { url: 'attachment://versus.png' }
		}
	] as any;

	const components = [
		{
			type: 1,
			components: [
				{
					type: 3,
					custom_id: 'format',
					options: [
						{ label: '[Gen 8] Random Battle', value: 'gen8randombattle' },
						{ label: '[Gen 7] Random Battle', value: 'gen7randombattle' },
						{ label: '[Gen 6] Random Battle', value: 'gen6randombattle' },
						{ label: '[Gen 5] Random Battle', value: 'gen5randombattle' }
					],
					placeholder: 'Select Battle Format'
				}
			]
		},
		{
			type: 1,
			components: [
				{
					type: 2,
					custom_id: 'start',
					label: 'Start Battle',
					style: 1
				},
				{
					type: 2,
					custom_id: 'team',
					label: 'Custom Team',
					style: 2,
					disabled: true
				},
				{
					type: 2,
					custom_id: 'cancel',
					label: 'Cancel',
					style: 4
				}
			]
		}
	];

	const image = await versusScreen(interaction);
	const files = [{ attachment: image, name: 'versus.png' }];

	await interaction.editReply({ embeds, components, files });
	await interaction.followUp({ content: '[info] This application is experimental and may break at any time.', ephemeral: true });

	const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id;
	const collector = interaction.channel!.createMessageComponentCollector({ filter });

	collector.on('collect', async (i) => {
		await i.deferUpdate();

		if (i.customId === 'start') {
			collector.stop();
			await initiateBattle(interaction, formatid);
		}
		if (i.customId === 'cancel') {
			const embeds = [
				{
					title: 'Pokémon Showdown! Battle',
					thumbnail: { url: interaction.client.user?.displayAvatarURL() },
					description: '`Battle cancelled`',
					color: '0x5865F2'
				}
			] as any;

			collector.stop();
			await interaction.editReply({ embeds, components: [], files: [] });
		}
		if (i.customId === 'format') {
			if (!i.isSelectMenu()) return;
			const embeds = [
				{
					title: 'Pokémon Showdown! Battle',
					thumbnail: { url: interaction.client.user?.displayAvatarURL() },
					description: `Format: \`${
						(i.component.options as MessageSelectOption[]).find((x) => x.value === i.values[0])?.label
					}\`\nPlayers: \`${interaction.user.username}\` vs. \`${interaction.client.user?.username}\``,
					color: '0x5865F2',
					image: { url: 'attachment://versus.png' }
				}
			] as any;

			[formatid] = i.values;
			await interaction.editReply({ embeds });
		}
	});
}
