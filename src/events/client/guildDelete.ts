import { Guild, MessageEmbed } from 'discord.js';
import Util from '../../Util.js';

export default {
  name: 'guildDelete',
  async run(guild: Guild): Promise<void> {
    const embed = new MessageEmbed()
      .setTitle('Left guild:')
      .setDescription(
        `Guild: \`${guild.name}\` (${guild.id})\nMembers: \`${
          guild.members.cache.filter((x) => !x.user.bot).size
        }\` Bots: \`${
          guild.members.cache.filter((x) => x.user.bot).size
        }\`\nCreated at: \`${guild.createdAt.toDateString()}\`\nOwner: \`${
          guild.ownerID
        }\``
      )
      .setThumbnail(guild.iconURL() as string)
      .setColor('#458bcc')
      .setFooter(
        'Showdown! | by adrifcastr',
        process.showdown.user?.displayAvatarURL()
      );

    Util.log(embed);
  },
};
