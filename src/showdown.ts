import {Dex, Teams as DTeams, RandomPlayerAI, BattleStreams, Move} from '@pkmn/sim';
import {Protocol, Handler, ArgName, ArgType, BattleArgsKWArgType} from '@pkmn/protocol';
import {Battle} from '@pkmn/client';
import {TeamGenerators} from '@pkmn/randoms';
import {LogFormatter} from '@pkmn/view';
import {Generations} from '@pkmn/data';

DTeams.setGeneratorFactory(TeamGenerators);
const gens = new Generations(Dex as any);

const displayLog = (text: string) => {
  console.log(text);
};

const spec = {formatid: 'gen8randombattle'};
const p1spec = {name: 'castdrian', team: DTeams.pack(DTeams.generate('gen8randombattle'))};
const p2spec = {name: 'Showdown!', team: DTeams.pack(DTeams.generate('gen8randombattle'))};

const streams = BattleStreams.getPlayerStreams(new BattleStreams.BattleStream());

const p2 = new RandomPlayerAI(streams.p2);
p2.start();

const battle = new Battle(gens);
const formatter = new LogFormatter('p1', battle);

class PreHandler implements Handler<void> {
  constructor(private readonly battle: Battle) {
    this.battle = battle;
  }

  '|faint|'(args: Protocol.Args['|faint|']) {
    const poke = this.battle.getPokemon(args[1]);
  }
}

class PostHandler implements Handler<void> {
  constructor(private readonly battle: Battle) {
    this.battle = battle;
  }

  '|teampreview|'() {
    
  }

  '|turn|'(args: Protocol.Args['|turn|']) {
  }
}

const pre = new PreHandler(battle);
const post = new PostHandler(battle);

const add = <T>(h: Handler<T>, k: ArgName | undefined, a: ArgType, kw: BattleArgsKWArgType) => {
  if (k && k in h) (h as any)[k](a, kw);
};

(async () => {
  for await (const chunk of streams.omniscient) {
    for (const line of chunk.split('\n')) {
      const {args, kwArgs} = Protocol.parseBattleLine(line);
      const text = formatter.formatText(args, kwArgs);
      const key = Protocol.key(args);

      add(pre, key, args, kwArgs);
      battle.add(args, kwArgs);
      add(post, key, args, kwArgs);

      displayLog(text);
    }
    battle.update();
  }
})();

streams.omniscient.write(`>start ${JSON.stringify(spec)}
>player p1 ${JSON.stringify(p1spec)}
>player p2 ${JSON.stringify(p2spec)}`);

(async () => {
  for await (const chunk of streams.p1) {
    for (const line of chunk.split('\n')) {
      const {args, kwArgs} = Protocol.parseBattleLine(line);
      battle.add(args, kwArgs);
    }
    battle.update();
    if (battle.request?.requestType === 'move') {
      const activemon = battle.p1.active[0];
      const opponent = battle.p1.foe.active[0];
      console.log(activemon?.moveSlots)
      console.log(activemon?.moves)
      //activemon?.useMove(, opponent)
      //streams.p1.write(`move ${JSON.stringify(activemon?.moves[0])}`)
    }
  }
})();