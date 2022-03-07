declare global {
	namespace NodeJS {
		export interface Process {
			battlelog: string[];
			fainted: boolean;
		}
	}
}

export interface formaticon {
	[key: string]: string;
}
