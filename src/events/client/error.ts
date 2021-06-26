import Util from '../../Util.js';

export default {
    name: 'error',
    async run(err: Error): Promise<void> {
        Util.log(`Bot error: \`\`\`\n${err.stack}\n\`\`\``);
    }
};