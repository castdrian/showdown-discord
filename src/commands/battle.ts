import { type ApplicationCommandRegistry, Command, RegisterBehavior } from '@sapphire/framework';
import { CommandInteraction, Formatters, Message, MessageAttachment } from 'discord.js';
import newGithubIssueUrl from 'new-github-issue-url';
import { startScreen } from '#handlers/startscreen';

export class Battle extends Command {
	public override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply();
		const message = await interaction.fetchReply();

		// try catch the entire thing and send an error message if it fails
		try {
			// do the battle stuff
			await startScreen(interaction);
		} catch (error: any) {
			// send pretty formatted error message including attachment of stack trace and link to open a new issue
			if (message instanceof Message) {
				const components = [
					{
						type: 1,
						components: [
							{
								type: 2,
								label: 'Report Issue',
								style: 5,
								url: newGithubIssueUrl({
									user: 'castdrian',
									repo: 'showdown',
									title: `Error: ${error.message}`,
									body: `**Describe the issue:**\n\n**To Reproduce:**\n\n**Expected behavior:**\n\n**Screenshots:**\n\n**Additional context:**\n\n**Upload Stack Trace:**`
								})
							}
						]
					}
				] as any;
				await message.reply({
					// ansi red bold error message
					content: `An error occurred while running the simulation:\n${Formatters.codeBlock(
						'ansi',
						`\u001b[1;31m${error.message}\u001b[0m`
					)}`,
					components,
					files: [new MessageAttachment(Buffer.from(error.stack), 'stacktrace.txt')]
				});
				await interaction.deleteReply();
			}
		}
	}

	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand(
			{
				name: this.name,
				description: 'Start a Showdown! battle'
			},
			{
				guildIds: process.env.DEV_GUILD_ID ? [process.env.DEV_GUILD_ID] : undefined,
				behaviorWhenNotIdentical: RegisterBehavior.Overwrite
			}
		);
	}
}
