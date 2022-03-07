import { versusScreen } from '#util/canvas';
import type { CommandInteraction, MessageComponentInteraction, MessageSelectOption } from 'discord.js';
import { initiateBattle } from '#handlers/simulation';
import type { formaticon } from '#types/';
import { components, modal } from '#constants/components';

export async function startScreen(interaction: CommandInteraction) {
	let formatid = 'gen8randombattle';
	let team: string;

	const embeds = [
		{
			title: 'Pokémon Showdown! Battle',
			thumbnail: { url: 'attachment://format.png' },
			description: `Format: \`[Gen 8] Random Battle\`\nPlayers: \`${interaction.user.username}\` vs. \`${interaction.client.user?.username}\``,
			color: '0x5865F2',
			image: { url: 'attachment://versus.png' }
		}
	] as any;

	const image = await versusScreen(interaction);
	const files = [
		{ attachment: image, name: 'versus.png' },
		{ attachment: './data/images/swsh.png', name: 'format.png' }
	];

	await interaction.editReply({ embeds, components, files });
	await interaction.followUp({
		content:
			'[info] This application is experimental and may break at any time.\n[info] You may just want to play [Pokémon Showdown](https://play.pokemonshowdown.com).',
		ephemeral: true
	});

	const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id;
	const collector = interaction.channel!.createMessageComponentCollector({ filter });

	collector.on('collect', async (i) => {
		if (i.customId === 'start') {
			await i.deferUpdate();
			collector.stop();
			await initiateBattle(interaction, formatid, team);
		}
		if (i.customId === 'cancel') {
			await i.deferUpdate();
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
			await i.deferUpdate();
			if (!i.isSelectMenu()) return;
			[formatid] = i.values;

			const embeds = [
				{
					title: 'Pokémon Showdown! Battle',
					thumbnail: { url: 'attachment://format.png' },
					description: `Format: \`${
						(i.component.options as MessageSelectOption[]).find((x) => x.value === i.values[0])?.label
					}\`\nPlayers: \`${interaction.user.username}\` vs. \`${interaction.client.user?.username}\``,
					color: '0x5865F2',
					image: { url: 'attachment://versus.png' }
				}
			] as any;

			const formatimgs: formaticon = {
				gen8randombattle: './data/images/swsh.png',
				gen7randombattle: './data/images/sumo.png',
				gen6randombattle: './data/images/xy.png',
				gen5randombattle: './data/images/bw.png'
			};

			const thumbnail = formatimgs[formatid];
			const files = [
				{ attachment: image, name: 'versus.png' },
				{ attachment: thumbnail, name: 'format.png' }
			];
			await interaction.editReply({ embeds, files });
		}
		if (i.customId === 'team') {
			await i.showModal(modal);

			try {
				const submit = await interaction.awaitModalSubmit({
					filter: (i) => i.customId === `modal-${interaction.id}`,
					time: 20000
				});
				await submit.reply({ content: `Team imported successfully!`, ephemeral: true });
			} catch (e) {
				await interaction.followUp({ content: 'Team import timed out.', ephemeral: true });
			}
		}
	});
}
