/* eslint-disable no-restricted-syntax */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable max-classes-per-file */
/* eslint-disable class-methods-use-this */
import {
  CommandInteraction,
  MessageComponentInteraction,
  Message,
  ApplicationCommandData,
} from 'discord.js';
import { Dex, Teams, RandomPlayerAI, BattleStreams } from '@pkmn/sim';
import {
  Protocol,
  Handler,
  ArgName,
  ArgType,
  BattleArgsKWArgType,
} from '@pkmn/protocol';
import { Battle } from '@pkmn/client';
import { TeamGenerators } from '@pkmn/randoms';
import { LogFormatter } from '@pkmn/view';
import { Generations } from '@pkmn/data';

export async function run(interaction: CommandInteraction): Promise<void> {
  Teams.setGeneratorFactory(TeamGenerators);
  const gens = new Generations(Dex as any);

  const spec = { formatid: 'gen8customgame' };

  const p1spec = {
    name: interaction.user.username,
    team: Teams.pack(Teams.generate('gen8randombattle')),
  };
  const p2spec = {
    name: 'Showdown!',
    team: Teams.pack(Teams.generate('gen8randombattle')),
  };

  const streams = BattleStreams.getPlayerStreams(
    new BattleStreams.BattleStream()
  );

  const p2 = new RandomPlayerAI(streams.p2);
  p2.start();

  /* interaction.editReply('Battle format: `Gen 8 random singles battle`', { components: [startrow] });  */

  const message = (await interaction.fetchReply()) as Message;

  const filter = (i: MessageComponentInteraction) =>
    i.user.id === interaction.user.id;
  const collector = message.createMessageComponentInteractionCollector(filter);

  const displayLog = (log: string) => {
    if (!log) return;
    console.log(log);
  };

  class PreHandler implements Handler<void> {
    battle: Battle;

    constructor(battle: Battle) {
      this.battle = battle;
    }

    '|faint|'() {}
  }

  class PostHandler implements Handler<void> {
    constructor(private readonly battle: Battle) {
      this.battle = battle;
    }

    '|teampreview|'() {
      console.log(this.battle.request);
      console.log('previeewww');
    }

    '|turn|'() {
      console.log('turnnnn');
    }
  }

  collector.on('collect', async (i: MessageComponentInteraction) => {
    await i.deferUpdate();
    if (i.customID === 'startbattle') {
      const battle = new Battle(gens);
      const formatter = new LogFormatter('p1', battle);

      const pre = new PreHandler(battle);
      const post = new PostHandler(battle);

      const add = <T>(
        h: Handler<T>,
        k: ArgName | undefined,
        a: ArgType,
        kw: BattleArgsKWArgType
      ) => {
        if (k && k in h) (h as any)[k](a, kw);
      };

      (async () => {
        for await (const chunk of streams.omniscient) {
          for (const line of chunk.split('\n')) {
            const { args, kwArgs } = Protocol.parseBattleLine(line);
            const log = formatter.formatText(args, kwArgs);
            const key = Protocol.key(args);

            add(pre, key, args, kwArgs);
            battle.add(args, kwArgs);
            add(post, key, args, kwArgs);

            displayLog(log);
          }
          battle.update();
        }

        for await (const chunk of streams.p1) {
          for (const line of chunk.split('\n')) {
            const { args, kwArgs } = Protocol.parseBattleLine(line);
            const log = formatter.formatText(args, kwArgs);
            const key = Protocol.key(args);

            add(pre, key, args, kwArgs);
            battle.add(args, kwArgs);
            add(post, key, args, kwArgs);

            displayLog(log);
          }
          battle.update();
        }
      })();

      streams.omniscient.write(`>start ${JSON.stringify(spec)}`);
      streams.omniscient.write(`>player p1 ${JSON.stringify(p1spec)}`);
      streams.omniscient.write(`>player p2 ${JSON.stringify(p2spec)}`);

      // for (const move of activemon.moves) {
      //   moverow.addComponents(new MessageButton().setCustomID(move).setLabel(move.charAt(0).toUpperCase() + move.slice(1)).setStyle('PRIMARY'));
      //    movebuttons.push(move)
      // }

      // const monname = activemon.details.split(',')[0];
      // const hp = activemon.condition;

      // .setFooter(`${monname} | ${hp}HP`, interaction.user.displayAvatarURL())
      // .setImage(`https://play.pokemonshowdown.com/sprites/ani-back/${monname.toLowerCase().trim()}.gif`);

      // await i.editReply({ embeds: [embed], components: [moverow, optionsrow] });
    }

    /*  if (movebuttons.some((x: String) => x === i.customID)) {
            streams.p1.write(`>p1 move ${i.customID}`);
            await i.editReply('You chose ' + i.customID.charAt(0).toUpperCase() + i.customID.slice(1), { components: [] });
          }

          if (i.customID === 'forfeit') {
            await i.editReply('Battle cancelled. You lost.', { components: [] });
          }

          if (i.customID === 'switch') {
            await i.editReply('Check console. lol.', { components: [] });
          } */
  });
}

export const data: ApplicationCommandData = {
  name: 'battle',
  description: 'Start a battle simulation',
};
