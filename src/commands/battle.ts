import { type ApplicationCommandRegistry, Command, RegisterBehavior } from '@sapphire/framework';
import { CommandInteraction, Message } from 'discord.js';
import { startScreen } from '#handlers/startscreen';
import { sendErrorToUser } from '#util/functions';

export class Battle extends Command {
	public override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply();
		const message = await interaction.fetchReply();

		// attach global rejection handler and global uncaught exception handler
		process.on('unhandledRejection', (err: any) => {
			this.container.logger.error(err);
			sendErrorToUser(err, message as Message, interaction);
		});
		process.on('uncaughtException', (err) => {
			this.container.logger.error(err);
			sendErrorToUser(err, message as Message, interaction);
		});

		// try catch the entire thing and send an error message if it fails
		try {
			// do the battle stuff
			await startScreen(interaction);
		} catch (error: any) {
			if (message instanceof Message) {
				await sendErrorToUser(error, message, interaction);
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
