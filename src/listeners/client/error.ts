import { Listener } from '@sapphire/framework';

export class ErrorListener extends Listener {
	public run(err: Error) {
		console.log(`Bot error: ${err.stack}`);
	}
}
