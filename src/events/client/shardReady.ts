import Util from '../../Util.js';

export default {
  name: 'shardReady',
  async run(id: number, unavailableGuilds: Set<string>): Promise<void> {
    if (!unavailableGuilds) Util.log(`Shard \`${id}\` is connected!`);
    else
      Util.log(
        `Shard \`${id}\` is connected!\n\nThe following guilds are unavailable due to a server outage:\n\`\`\`\n${Array.from(
          unavailableGuilds
        ).join('\n')}\n\`\`\``
      );
  },
};
