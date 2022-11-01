import type { MessageEditOptions } from 'discord.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const waitFor = async function waitFor(f: any) {
	while (!f()) await sleep(1000);
	return f();
};

export const fixCustomId = (components: any): MessageEditOptions['components'] => {
	// now, replace every custom_id with its own value concatenated with a unique id per component

	// first, generate a unique id for each component
	const componentsWithIds = components.map((c: any) => {
		if (c.type === 1) {
			return {
				...c,
				components: c.components.map((c: any) => {
					return {
						...c,
						// generate unique snowflake
						uniqueId: BigInt(Math.floor(Math.random() * 2 ** 64)).toString(16)
					};
				})
			};
		}
		return {
			...c,
			// generate unique snowflake
			uniqueId: BigInt(Math.floor(Math.random() * 2 ** 64)).toString(16)
		};
	});

	// now, replace every custom_id with its own value concatenated with a unique id per component
	const fixedComponents = componentsWithIds.map((c: any) => {
		if (c.type === 1) {
			return {
				...c,
				components: c.components.map((c: any) => {
					return {
						...c,
						custom_id: c.custom_id + c.uniqueId
					};
				})
			};
		}
		return {
			...c,
			custom_id: c.custom_id + c.uniqueId
		};
	});
	return fixedComponents;
};

// function to get the original custom_id from the modified one
export const getCustomId = (customId: string) => {
	// match the snowflake at the end of the string
	const match = customId.match(/([0-9a-f]{16})$/);
	if (!match) return customId;
	const uniqueId = match[1];
	// remove the unique id from the custom_id
	return customId.replace(uniqueId, '');
};
