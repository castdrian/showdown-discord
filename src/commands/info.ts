import { type ApplicationCommandRegistry, Command, RegisterBehavior, version as sversion } from '@sapphire/framework';
import { CommandInteraction, Message, time, version } from 'discord.js';
import { sendErrorToUser } from '#util/functions';
import { default as lcl } from 'last-commit-log';
import { default as ts } from 'typescript';
import { cpus, totalmem } from 'os';

export class Info extends Command {
	public override async chatInputRun(interaction: CommandInteraction) {
		await interaction.deferReply();
		const message = await interaction.fetchReply();
		// try catch the entire thing and send an error message if it fails
		try {
			const guilds = this.container.client.guilds.cache.size;
			const users = this.container.client.guilds.cache.reduce((a, b) => a + b.memberCount, 0);
			const channels = this.container.client.channels.cache.size;
			const { readyAt } = this.container.client;
			const uptimeString = time(readyAt!, 'R');
			const cpu = process.cpuUsage();
			const cpuUsage = Math.round((cpu.user + cpu.system) / 1000000);
			const cpuCount = cpus().length;
			const cpuModel = cpus()[0].model;
			const osString = `${process.platform} ${cpuCount}x ${cpuModel}`;
			const cpuUsageString = `Using ${cpuUsage}% of ${cpuCount} CPU cores`;
			const memory = process.memoryUsage().heapUsed / 1024 / 1024;
			const memoryString = `${memory.toFixed(2)} MB / ${Math.round(totalmem() / 1024 / 1024)} MB`;
			const shard = this.container.client.shard?.ids[0] ?? 0;
			const shardCount = this.container.client.shard?.count ?? 1;
			const shardString = `${shard + 1}/${shardCount}`;
			const lclInstance = new lcl(process.cwd());
			const lastCommit = await lclInstance.getLastCommit();
			const { gitUrl, shortHash, subject } = lastCommit;
			const commitString = `[${shortHash}](${gitUrl}) - ${subject}`;
			const node = `[${process.version}](https://nodejs.org/en/download/releases/)`;
			const tsver = `[v${ts.version}](https://www.typescriptlang.org/download)`;
			const latency = this.container.client.ws.ping;
			const djs = `[v${version}](https://discord.js.org)`;
			const sapphire = `[v${sversion}](https://sapphirejs.dev)`;

			const embed = {
				title: 'Showdown! Info',
				thumbnail: {
					url: this.container.client.user?.displayAvatarURL() ?? ''
				},
				description: `**Guilds:** ${guilds}\n**Users:** ${users}\n**Channels:** ${channels}\n**Uptime:** Container started ${uptimeString}\n**Latency:** ${latency} ms\n**System:** ${osString}\n**CPU Usage:** ${cpuUsageString}\n**Memory Usage:** ${memoryString}\n**Shard:** ${shardString}\n**Current Commit:** ${commitString}\n**Node:** ${node}\n**TypeScript:** ${tsver}\n**Discord.js:** ${djs}\n**Sapphire:** ${sapphire}`,
				color: 0x5865f2
			};

			const components = [
				{
					type: 1,
					components: [
						{
							type: 2,
							label: 'Contact',
							style: 5,
							url: 'discord://-/users/224617799434108928'
						},
						{
							type: 2,
							label: 'Support Server',
							style: 5,
							url: 'https://discord.gg/JRwVqEXHxp'
						},
						{
							type: 2,
							label: 'GitHub',
							style: 5,
							url: 'https://github.com/castdrian/showdown'
						},
						{
							type: 2,
							label: 'Add to Server',
							style: 5,
							url: 'https://discord.com/api/oauth2/authorize?client_id=847595833347801118&permissions=314368&scope=applications.commands%20bot'
						}
					]
				}
			];

			await interaction.editReply({ embeds: [embed], components });
		} catch (error: any) {
			if (message instanceof Message) {
				await sendErrorToUser(error, message, interaction);
			}
		}
	}

	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand(
			{
				name: this.name,
				description: 'Show Showdown! info'
			},
			{
				guildIds: process.env.DEV_GUILD_ID ? [process.env.DEV_GUILD_ID] : undefined,
				behaviorWhenNotIdentical: RegisterBehavior.Overwrite
			}
		);
	}
}
