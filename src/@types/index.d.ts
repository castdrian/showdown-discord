declare global {
	namespace NodeJS {
		export interface Process {
			battlelog: string[];
		}
	}
}

export interface formaticon {
	[key: string]: string;
}
