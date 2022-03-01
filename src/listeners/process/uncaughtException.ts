import { Listener } from '@sapphire/framework';

export class ExceptionListener extends Listener {
	public run(err: Error): void {
		console.log(`Uncaught Exception: ${err.stack}`);
	}
}
