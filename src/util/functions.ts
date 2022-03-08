const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const waitFor = async function waitFor(f: any) {
	while (!f()) await sleep(1000);
	return f();
};
