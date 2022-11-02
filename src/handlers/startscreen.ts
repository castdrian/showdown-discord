import { versusScreen } from '#util/canvas';
import {
	CommandInteraction,
	Formatters,
	Message,
	MessageAttachment,
	MessageComponentInteraction,
	MessageSelectOption,
	ModalSubmitInteraction
} from 'discord.js';
import { initiateBattle } from '#handlers/simulation';
import type { formaticon, PokePasteResponse } from '#types/';
import { components, modal } from '#constants/components';
import { Dex, TeamValidator } from '@pkmn/sim';
import { Teams, Data, PokemonSet } from '@pkmn/sets';
import { fetchRomaji, RomajiMon, RomajiMove } from 'pkmn-romaji';
import { request } from 'undici';

export async function startScreen(interaction: CommandInteraction) {
	let formatid = 'gen8randombattle';
	let battle_team: PokemonSet[];
	process.romaji = false;
	process.romajiMons = (await fetchRomaji({ allMons: true })) as RomajiMon[];
	process.romajiMoves = (await fetchRomaji({ allMoves: true })) as RomajiMove[];

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

	const message = (await interaction.editReply({ embeds, components, files })) as Message;
	const { id } = await interaction.followUp({
		content:
			'[info] This application is very experimental and may break at any time.\n[info] You may just want to play [Pokémon Showdown](https://play.pokemonshowdown.com).',
		ephemeral: true
	});

	const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id;
	const collector = message!.createMessageComponentCollector({ filter });

	collector.on('collect', async (i): Promise<any> => {
		if (i.customId === 'start') {
			await i.deferUpdate();
			collector.stop();
			// @ts-ignore delete ephemeral message
			await interaction.client.api.webhooks(i.client.user!.id, interaction.token).messages(id).delete();
			const message = await interaction.fetchReply();
			if (message instanceof Message) {
				await initiateBattle(message, interaction.user, formatid, battle_team);
				process.romaji = false;
				const file = new MessageAttachment('http://play.pokemonshowdown.com/audio/xy-trainer.mp3', 'Battle Theme.mp3');
				await message.channel.send({ files: [file] });
			}
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
			await i.editReply({ embeds, components: [], files: [] });
		}
		if (i.customId === 'romaji') {
			await i.deferUpdate();
			process.romaji = !process.romaji;
			// change the button label to reflect the new state of the romaji toggle and update the message with the new label
			components[1].components[2].label = process.romaji ? 'Romaji: On' : 'Romaji: Off';
			await i.editReply({ components });
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
			if (submit) await submit.deferReply({ ephemeral: true });

			const rawUrl = submit.fields.getTextInputValue('paste_url');
			// validate pokepaste url
			if (!rawUrl.startsWith('https://pokepast.es/')) {
				return submit.editReply({ content: 'Invalid URL. Please try again.' });
			}

			// fetch the url and append /json to the end
			const { body, statusCode } = await request(`${rawUrl}/json`);
			if (statusCode !== 200) {
				return submit.editReply({ content: 'Invalid URL. Please try again.' });
			}
			const pasteTeam: PokePasteResponse = await body.json();

			const validator = new TeamValidator('gen8customgame');
			const dex = Dex.forFormat('gen8customgame');

			const team = Teams.importTeam(pasteTeam.paste, dex as Data)?.team as PokemonSet[];
			const invalid = validator.validateTeam(team);

			if (!team || invalid) {
				return submit.editReply({
					content: `Team ${Formatters.inlineCode(pasteTeam.title)} is invalid:\n\n${Formatters.codeBlock(
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
						pasteTeam.title
					)}\n${Formatters.codeBlock(
						// iterate over the team and format it into a readable string
						// eslint-disable-next-line no-negated-condition
						team.map((x) => `${x.name} ${x.name !== x.species ? `(${x.species})` : ''}`).join('\n')
					)}`,
					color: '0x5865F2',
					image: { url: 'attachment://versus.png' }
				}
			] as any;

			await interaction.editReply({ embeds, files });
			battle_team = team;
			await submit.editReply({ content: `Team ${Formatters.inlineCode(pasteTeam.title)} imported successfully!` });
		}
	});
}
