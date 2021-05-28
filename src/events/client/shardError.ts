import Util from '../../Util.js';

export default {
    name: 'shardError',
    async run(error: Error, shardID: number): Promise<void> {
        Util.log(`Shard \`${shardID}\` has encountered a connection error:\n\n\`\`\`\n${error}\n\`\`\``);
    }
};