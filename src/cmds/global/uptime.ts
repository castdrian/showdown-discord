import { CommandInteraction, MessageEmbed } from 'discord.js';
import { Command } from 'src/@types/Util.js';
import Util from '../../Util.js';

/**
 * @param {Discord.Intercation} interaction
 */
export async function run(interaction: CommandInteraction): Promise<void> {
    const embed = new MessageEmbed()
    .setTitle('Uptime:')
    .setDescription(Util.secondsToDifferenceString(process.showdown.uptime as number / 1000, { enableSeconds: true }))
    .setColor('#458bcc')
    .setThumbnail((process.showdown.user?.displayAvatarURL() as string))
    .setFooter('Showdown! | by adrifcastr', process.showdown.user?.displayAvatarURL());
        
    return interaction.editReply(embed);
}

export const info: Command['info'] = {
    roles: [],
    user_perms: [],
    bot_perms: []
};

export const data: Command['data'] = {
    name: 'uptime',
    description: 'Showdown!\'s uptime'
};