import type { Battle } from '@pkmn/client';
import { Dex, MoveName } from '@pkmn/dex';
import { Formatters } from 'discord.js';

const RED_BOLD = '\u001b[1;31m';
const BLUE_BOLD = '\u001b[1;34m';
const MAGENTA_BOLD = '\u001b[1;35m';
const CYAN_BOLD = '\u001b[1;36m';
const WHITE_BOLD = '\u001b[1;37m';
const RESET = '\u001b[0m';

export function formatBattleLog(log: string[], battle: Battle): string {
	// cut down log to last 10 lines
	// if there are more than 2 linebreaks in a row, replace them with 2 linebreaks
	let str = log
		.slice(-10)
		.join('\n')
		.replace(/\n{3,}/g, '\n\n');

	// grab text that is engulfed in three pairs of pipes like "||27/278||9.7%||" and replace it with a formatted string
	str = str.replace(/\|\|(\d+\/\d+)\|\|(\d+\.?\d*%)\|\|/g, (_match, _hp, percent) => `${MAGENTA_BOLD}${percent}${RESET}`);

	// repeat this for the same text if it has negative numbers in it like "||−18/297||6.1%||"
	str = str.replace(/\|\|−(\d+\/\d+)\|\|(\d+\.?\d*%)\|\|/g, (_match, _hp, percent) => `${MAGENTA_BOLD}${percent}${RESET}`);

	// use ansi escape codes to format every instance the names of the active mons red bold
	const p1 = battle.p1.active[0]!;
	const p2 = battle.p2.active[0]!;

	// apply romaji mode if it is enabled
	if (process.romaji && process.romajiMons && process.romajiMoves) {
		// replace all instances of the mons' names with their romaji names
		const p1eng = process.romajiMons.find((m) => m.trademark.toLowerCase() === p1.name.toLowerCase())?.name;
		const p2eng = process.romajiMons.find((m) => m.trademark.toLowerCase() === p2.name.toLowerCase())?.name;

		if (p1eng && p2eng) {
			str = str.replace(new RegExp(p1eng, 'g'), p1.name);
			str = str.replace(new RegExp(p2eng, 'g'), p2.name);
		}
	}

	str = str.replace(new RegExp(p1.name, 'g'), `${RED_BOLD}${p1.name}${RESET}`);
	str = str.replace(new RegExp(p2.name, 'g'), `${RED_BOLD}${p2.name}${RESET}`);

	// format the player names cyan bold
	str = str.replace(new RegExp(battle.p1.name, 'g'), `${CYAN_BOLD}${battle.p1.name}${RESET}`);
	str = str.replace(new RegExp(battle.p2.name, 'g'), `${CYAN_BOLD}${battle.p2.name}${RESET}`);

	// format turn and turn number white bold
	str = str.replace(/(Turn )(\d+)/g, `${WHITE_BOLD}$1$2${RESET}`);

	// format all moves from both active mons blue bold
	const moveIDs = [...p1.moves, ...p2.moves].map((move) => move);
	const moveNames = moveIDs.map((move) => Dex.moves.get(move).name);

	for (let move of moveNames) {
		if (process.romaji && process.romajiMons && process.romajiMoves) {
			const romajiMove =
				(process.romajiMoves.find((m) => m.move.replace(/\s/g, '').toLowerCase() === move.replace(/\s/g, '').toLowerCase())
					?.romaji as MoveName) ?? move;
			str = str.replace(new RegExp(move, 'g'), romajiMove);
			move = romajiMove;
		}
		str = str.replace(new RegExp(move, 'g'), `${BLUE_BOLD}${move}${RESET}`);
	}

	// format as ansi code block
	const result = Formatters.codeBlock('ansi', str);
	return result;
}
