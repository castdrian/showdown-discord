import Util from '../../Util.js';

export default {
    name: 'uncaughtException',
    process: true,
    async run(err: Error): Promise<void> {
        Util.log(`Uncaught Exception: \`\`\`\n${err.stack}\n\`\`\``);
    }
};