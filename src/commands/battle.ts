import { type ApplicationCommandRegistry, Command, RegisterBehavior } from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';
import { startScreen } from '#handlers/startscreen';

export class Battle extends Command {
	public override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply();
		await startScreen(interaction);
	}

	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand(
			{
				name: this.name,
				description: 'Start a Showdown! battle'
			},
			{
				guildIds: ['709061970078335027'],
				behaviorWhenNotIdentical: RegisterBehavior.Overwrite
			}
		);
	}
}
