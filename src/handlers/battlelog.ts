// @ts-ignore no types
import pkg from '@tommoor/remove-markdown';
const { removeMD } = pkg;

export function displayLog(text: string) {
	console.log(removeMD(text));
}
