import {
  ApplicationCommandData,
  CommandInteraction,
  MessageEmbed,
} from 'discord.js';
import Util from '../../Util.js';

export async function run(interaction: CommandInteraction): Promise<unknown> {
  const embed = new MessageEmbed()
    .setTitle('Uptime:')
    .setDescription(
      Util.secondsToDifferenceString(
        (process.showdown.uptime as number) / 1000,
        { enableSeconds: true }
      )
    )
    .setColor('#458bcc')
    .setThumbnail(process.showdown.user?.displayAvatarURL() as string)
    .setFooter(
      'Showdown! | by adrifcastr',
      process.showdown.user?.displayAvatarURL()
    );

  return interaction.editReply({ embeds: [embed] });
}

export const data: ApplicationCommandData = {
  name: 'uptime',
  description: "Showdown!'s uptime",
};
