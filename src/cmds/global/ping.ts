import { CommandInteraction, MessageEmbed } from 'discord.js';
import { Command } from 'src/@types/Util.js';
import Util from '../../Util.js';

export async function run(interaction: CommandInteraction): Promise<void> {
    const start = process.hrtime.bigint();

    Util.fetchJSON('https://discord.com/api/v9/gateway').then(() => {
        const took = (process.hrtime.bigint() - start) / BigInt('1000000');

        const embed = new MessageEmbed()
        .setTitle('Ping:')
        .setDescription(`WebSocket ping: ${process.showdown.ws.ping.toFixed(2)} ms\nREST ping: ${took} ms`)
        .setColor('#CB45CC')
        .setThumbnail((process.showdown.user?.displayAvatarURL() as string))
        .setFooter('Showdown! | by adrifcastr', process.showdown.user?.displayAvatarURL());

        return interaction.editReply(embed);
    }, failed => {
        console.log(failed);
        return interaction.editReply('Failed to measure ping!');
    });
}

export const info: Command['info'] = {
    roles: [],
    user_perms: [],
    bot_perms: []
};

export const data: Command['data'] = {
    name: 'ping',
    description: 'ping alot'
};