import dotenv from 'dotenv';
import PrettyError from 'pretty-error';
import Discord from 'discord.js';
import Util from './Util.js';

dotenv.config({ path: '../.env' });
PrettyError.start().withoutColors();

const showdown = new Discord.Client({
  intents: 1,
  shards: 'auto',
  allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
  restRequestTimeout: 25000,
});

process.showdown = showdown;
showdown.commands = new Discord.Collection();
showdown.events = new Discord.Collection();

Util.LoadEvents().then(() => {
  // eslint-disable-next-line no-restricted-syntax
  for (const event of showdown.events.values()) {
    if (event.process) {
      if (event.once) {
        // @ts-expect-error dis is valid bro
        process.once(event.name, (...args) => event.run(...args));
      } else process.on(event.name, (...args) => event.run(...args));
    } else if (event.once)
      showdown.once(event.name, (...args: unknown[]) =>
        event.run(...args, showdown)
      );
    else
      showdown.on(event.name, (...args: unknown[]) =>
        event.run(...args, showdown)
      );
  }

  if (process.env.CLIENT_TOKEN) {
    showdown.login(process.env.CLIENT_TOKEN);
  } else {
    console.log('No client token!');
    process.exit(1);
  }
});
