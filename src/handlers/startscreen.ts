import { versusScreen } from '#util/canvas';
import { CommandInteraction, Formatters, MessageComponentInteraction, MessageSelectOption, ModalSubmitInteraction } from 'discord.js';
import { initiateBattle } from '#handlers/simulation';
import type { formaticon } from '#types/';
import { components, modal } from '#constants/components';
import { Dex, TeamValidator } from '@pkmn/sim';
import { Teams, Data, PokemonSet } from '@pkmn/sets';

export async function startScreen(interaction: CommandInteraction) {
	let formatid = 'gen8randombattle';
	let battle_team: PokemonSet[];

	const embeds = [
		{
			title: 'Pokémon Showdown! Battle',
			thumbnail: { url: 'attachment://format.png' },
			description: `Format: \`[Gen 8] Random Battle\`\nPlayers: ${Formatters.inlineCode(interaction.user.username)} vs. ${Formatters.inlineCode(
				interaction.client.user!.username
			)}\nTeam: \`Random\``,
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

	collector.on('collect', async (i): Promise<any> => {
		if (i.customId === 'start') {
			await i.deferUpdate();
			collector.stop();
			await initiateBattle(interaction, formatid, battle_team);
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
					}\`\nPlayers: ${Formatters.inlineCode(interaction.user.username)} vs. ${Formatters.inlineCode(
						interaction.client.user!.username
					)}\nTeam: \`Random\``,
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

			const submit = (await interaction
				.awaitModalSubmit({
					filter: (i) => i.customId === 'team_import',
					time: 20000
				})
				.catch(() => interaction.followUp({ content: 'Team import timed out.', ephemeral: true }))) as ModalSubmitInteraction;
			await submit.deferReply({ ephemeral: true });

			const team_name = submit.fields.getTextInputValue('team_name');
			const team_data = submit.fields.getTextInputValue('team_data');

			const validator = new TeamValidator('gen8customgame');
			const dex = Dex.forFormat('gen8customgame');

			const team = Teams.importTeam(team_data, dex as Data)?.team as PokemonSet[];
			const invalid = validator.validateTeam(team);

			if (!team || invalid) {
				return submit.editReply({
					content: `Team ${Formatters.inlineCode(team_name)} is invalid:\n\n${Formatters.codeBlock(
						invalid?.join('\n') ?? 'Invalid Team Data'
					)}`
				});
			}

			const embeds = [
				{
					title: 'Pokémon Showdown! Battle',
					thumbnail: { url: 'attachment://format.png' },
					description: `Format: \`[Gen 8] Random Battle\`\nPlayers: ${Formatters.inlineCode(
						interaction.user.username
					)} vs. ${Formatters.inlineCode(interaction.client.user!.username)}\nTeam: ${Formatters.inlineCode(
						team_name
					)}\n${Formatters.codeBlock(
						`- ${team[0].name}\n- ${team[1].name}\n- ${team[2].name}\n- ${team[3].name}\n- ${team[4].name}\n- ${team[5].name}`
					)}`,
					color: '0x5865F2',
					image: { url: 'attachment://versus.png' }
				}
			] as any;

			await interaction.editReply({ embeds, files });
			battle_team = team;
			await submit.editReply({ content: `Team ${Formatters.inlineCode(team_name)} imported successfully!` });
		}
	});
}
