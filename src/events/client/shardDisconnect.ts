import Discord from 'discord.js';
import Util from '../../Util.js';

export default {
  name: 'shardDisconnect',
  async run(event: Discord.CloseEvent, id: string): Promise<void> {
    Util.log(
      `Shard \`${id}\` disconnected:\n\n\`\`\`\nCode: ${event.code}\nReason: ${event.reason}\n\`\`\``
    );
  },
};
