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
    
        if (cmd.info?.user_perms?.length > 0) {
            const missingperms = [];

            for (const perm of cmd.info.user_perms) {
                if (!command.member?.permissions.has(perm)) missingperms.push(new Permissions(perm).toArray()[0]);
            }

            if (missingperms.length > 0) {
                process.showdown.emit('commandRefused', command, 'Missing: ' + missingperms.join(' '));
                return command.reply('You do not have the required permissions to use this command!\nRequired permissions: ' + missingperms.map(x => `\`${x}\``).join(' '));
            }
        }

        if (cmd.info?.bot_perms?.length > 0) {
            const missingperms = [];
            for (const perms of cmd.info.bot_perms) {
                if (!(command.channel as TextChannel).permissionsFor((command.guild?.me) as GuildMember).has(perms)) missingperms.push(new Permissions(perms).toArray()[0]);
            }
            if (missingperms.length > 0) return command.reply('Sorry I can\'t do that without having the required permissions for this command!\nRequired permissions: ' + missingperms.map(x => `\`${x}\``).join(' '), { ephemeral: true });
        }
        
        try {
            if (process.env.CI) console.log('Handling interaction ' + command.commandName);
            await cmd.run(command, options);
        }
        catch (e) {
            Util.log(`An error occurred while running ${command.commandName}:\n\n\`\`\`\n${e.stack}\n\`\`\``);
            return command.reply('An error occurred while processing your request:```\n' + e + '```', { ephemeral: true });
        }
    }
}

export default Interactions;
