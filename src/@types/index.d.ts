declare global {
	namespace NodeJS {
		export interface Process {
			battlelog: string[];
			fainted: boolean | null;
		}
	}
}

export interface formaticon {
	[key: string]: string;
}
