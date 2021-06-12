import { CommandInteraction, TextChannel, GuildMember, Permissions } from 'discord.js';
import Util from '../Util.js';

class Interactions {
    constructor() {
        throw new Error('This class cannot be instantiated!');
    };

    /**
     * Handle Slash Commands
     * @param {Discord.CommandInteraction} command 
     */
    static async SlashCommands(command: CommandInteraction): Promise<boolean | void> {
        command.defer();
        if (!command.guild) return;

        const options = command.options;
        const cmd = process.showdown.commands.get(command.commandName);
        if (!cmd) return;
        
        try {
            if (process.env.CI) console.log('Handling interaction ' + command.commandName);
            await cmd.run(command, options);
        }
        catch (e) {
            Util.log(`An error occurred while running ${command.commandName}:\n\n\`\`\`\n${e.stack}\n\`\`\``);
            return command.reply({ content: 'An error occurred while processing your request:```\n' + e + '```', ephemeral: true });
        }
    }
}

export default Interactions;
