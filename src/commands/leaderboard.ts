import { leaderBoardEmotes } from '#constants/emotes';
import { readLeaderboard } from '#util/firebase';
import { type ApplicationCommandRegistry, Command, RegisterBehavior } from '@sapphire/framework';
import { CommandInteraction } from 'discord.js';

export class Leaderboard extends Command {
	public override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply();
		const leaderboard = await readLeaderboard();

		if (leaderboard.length === 0) {
			await interaction.editReply({ content: 'The leaderboard is empty!' });
		} else {
			const desc = (
				await Promise.all(
					leaderboard.map(async (entry, index) => {
						const emote = index < 3 ? leaderBoardEmotes[index] : leaderBoardEmotes[3];
						const user = await interaction.client.users.fetch(entry.user_id).catch(() => null);
						const guild = interaction.client.guilds.cache.get(entry.guild_id)?.name ?? null;
						const wins = entry.wins === 1 ? 'win' : 'wins';
						const losses = entry.losses === 1 ? 'loss' : 'losses';
						return `${emote} ${user?.username ?? entry.user_id} - \`${entry.wins}\` ${wins}, \`${entry.losses}\` ${losses} ${
							guild ? `(${guild})` : ''
						}`;
					})
				)
			).join('\n');

			const embed = {
				title: 'Showdown! Leaderboard',
				thumbnail: {
					url: this.container.client.user?.displayAvatarURL() ?? ''
				},
				description: desc,
				color: 0x5865f2
			};

			await interaction.editReply({ embeds: [embed] });
		}
	}

	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand(
			{
				name: this.name,
				description: 'Show Showdown! leaderboard'
			},
			{
				guildIds: process.env.DEV_GUILD_ID ? [process.env.DEV_GUILD_ID] : undefined,
				behaviorWhenNotIdentical: RegisterBehavior.Overwrite
			}
		);
	}
}
