import { Listener } from '@sapphire/framework';

export class ShardListener extends Listener {
	public run(error: Error, shardID: number) {
		console.log(`Shard ${shardID} has encountered a connection error:\n${error.stack}`);
	}
}
