import { versusScreen } from '#util/canvas';
import { codeBlock, CommandInteraction, inlineCode, Message, MessageComponentInteraction, ModalSubmitInteraction } from 'discord.js';
import { initiateBattle } from '#handlers/simulation';
import type { formaticon, PokePasteResponse } from '#types/';
import { components, modal } from '#constants/components';
import { Dex, TeamValidator } from '@pkmn/sim';
import { Teams, Data, PokemonSet } from '@pkmn/sets';
import { fetchRomaji, RomajiMon, RomajiMove } from 'pkmn-romaji';
import { request } from 'undici';
import { getTwoRandomAvatars, sendErrorToUser } from '#util/functions';
import type NodeCache from 'node-cache';

export async function startScreen(interaction: CommandInteraction, cache: NodeCache) {
	let formatid = 'gen9randombattle';
	let battle_team: PokemonSet[];

	cache.set('romaji', false);

	const romajiMons = (await fetchRomaji({ allMons: true })) as RomajiMon[];
	const romajiMoves = (await fetchRomaji({ allMoves: true })) as RomajiMove[];

	cache.set('romajimons', romajiMons);
	cache.set('romajimoves', romajiMoves);

	const embeds = [
		{
			title: 'Pokémon Showdown! Battle',
			thumbnail: { url: 'attachment://format.png' },
			description: `Format: \`[Gen 9] Random Battle\`\nPlayers: ${inlineCode(interaction.user.username)} vs. ${inlineCode(
				interaction.client.user!.username
			)}\nTeam: \`Random\``,
			color: 0x5865f2,
			image: { url: 'attachment://versus.png' }
		}
	] as any;

	const image = await versusScreen(interaction);
	const files = [
		{ attachment: image, name: 'versus.png' },
		{ attachment: './data/images/sv.png', name: 'format.png' }
	];

	const message = (await interaction.editReply({ embeds, components, files })) as Message;
	const { id } = await interaction.followUp({
		content:
			'[info] This application is very experimental and may break at any time.\n[info] You may just want to play [Pokémon Showdown](https://play.pokemonshowdown.com).\nhttps://discord.gg/JRwVqEXHxp',
		components: [
			{
				type: 1,
				components: [
					{
						type: 2,
						label: 'Contact',
						style: 5,
						url: 'discord://-/users/224617799434108928'
					},
					{
						type: 2,
						label: 'GitHub',
						style: 5,
						url: 'https://github.com/castdrian/showdown'
					},
					{
						type: 2,
						label: 'Add to Server',
						style: 5,
						url: 'https://discord.com/api/oauth2/authorize?client_id=847595833347801118&permissions=314368&scope=applications.commands%20bot'
					}
				]
			}
		] as any,
		ephemeral: true
	});

	const filter = (i: any) => i.user.id === interaction.user.id;
	const collector = message!.createMessageComponentCollector({ filter });

	collector.on('collect', async (i: MessageComponentInteraction): Promise<any> => {
		if (i.customId === 'start') {
			await i.deferUpdate();
			collector.stop();
			await interaction.webhook.deleteMessage(id);
			const message = await interaction.fetchReply();
			if (message instanceof Message) {
				getTwoRandomAvatars(cache);
				await initiateBattle(interaction, message, interaction.user, formatid, battle_team, cache).catch((err) =>
					sendErrorToUser(err, message, interaction)
				);
				cache.set('romaji', false);
			}
		}
		if (i.customId === 'cancel') {
			await i.deferUpdate();
			collector.stop();
			await interaction.deleteReply();
		}
		if (i.customId === 'romaji') {
			await i.deferUpdate();
			const romaji = cache.get('romaji');
			if (romaji === 'true') {
				cache.set('romaji', false);
				components[1].components[2].label = 'Romaji: Off';
			} else {
				cache.set('romaji', true);
				components[1].components[2].label = 'Romaji: On';
			}

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
					description: `Format: \`${i.values.find((x) => x === i.values[0])}\`\nPlayers: ${inlineCode(
						interaction.user.username
					)} vs. ${inlineCode(interaction.client.user!.username)}\nTeam: \`Random\``,
					color: 0x5865f2,
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

			const submit = await interaction
				.awaitModalSubmit({
					filter: (i) => i.customId === 'team_import',
					time: 20000
				})
				.catch(() => interaction.followUp({ content: 'Team import timed out.', ephemeral: true }));
			if (submit instanceof ModalSubmitInteraction) {
				await submit.deferReply({ ephemeral: true });

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
						content: `Team ${inlineCode(pasteTeam.title)} is invalid:\n\n${codeBlock(invalid?.join('\n') ?? 'Invalid Team Data')}`
					});
				}

				const embeds = [
					{
						title: 'Pokémon Showdown! Battle',
						thumbnail: { url: 'attachment://format.png' },
						description: `Format: \`[Gen 8] Random Battle\`\nPlayers: ${inlineCode(interaction.user.username)} vs. ${inlineCode(
							interaction.client.user!.username
						)}\nTeam: ${inlineCode(pasteTeam.title)}\n${codeBlock(
							// iterate over the team and format it into a readable string
							// eslint-disable-next-line no-negated-condition
							team.map((x) => `${x.name} ${x.name !== x.species ? `(${x.species})` : ''}`).join('\n')
						)}`,
						color: 0x5865f2,
						image: { url: 'attachment://versus.png' }
					}
				] as any;

				await interaction.editReply({ embeds, files });
				battle_team = team;
				await submit.editReply({ content: `Team ${inlineCode(pasteTeam.title)} imported successfully!` });
			}
		}
	});
}
