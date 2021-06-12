import Discord from 'discord.js';
import fetch from 'node-fetch';
import Interactions from './handlers/Interactions.js';
import recursive from 'recursive-readdir';
import path from 'path';
import type { Command } from './@types/Util.js';
import { Collection } from 'discord.js';
import type { ApplicationCommandData } from 'discord.js';
import Md5 from 'md5';
import { Snowflake } from 'discord.js';

class Util {
    constructor() {
        throw new Error('This class cannot be instantiated!');
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    static get Interactions() { return Interactions; }

    static delay(inputDelay: number) : Promise<void> {
        // If the input is not a number, instantly resolve
        if (typeof inputDelay !== 'number') return Promise.resolve();
        // Otherwise, resolve after the number of milliseconds.
        return new Promise(resolve => setTimeout(resolve, inputDelay));
    }

    /**
     * Convert a time in seconds to a time string
     * @param {number} seconds_input 
     * @param {boolean} seconds 
     * @returns {string} The beautifully formatted string
     */
    static secondsToDifferenceString(seconds_input : number, { enableSeconds = true } : {enableSeconds: boolean}) : string {
        if (!seconds_input || typeof seconds_input !== 'number') return 'Unknown';

        const seconds = Math.floor(seconds_input % 60);
        seconds_input = seconds_input / 60;
        const minutes = Math.floor(seconds_input % 60);
        seconds_input = seconds_input / 60;
        const hours = Math.floor(seconds_input % 24);
        const days = Math.floor(seconds_input / 24);

        const dayString = days + ' day' + (days !== 1 ? 's' : '');
        const hourString = hours + ' hour' + (hours !== 1 ? 's' : '');
        const minuteString = minutes + ' minute' + (minutes !== 1 ? 's' : '');
        const secondString = seconds + ' second' + (seconds !== 1 ? 's' : '');

        const outputArray = [];
        if (days > 0) outputArray.push(dayString);
        if (hours > 0) outputArray.push(hourString);
        if (minutes > 0) outputArray.push(minuteString);
        if (seconds > 0 && enableSeconds) outputArray.push(secondString);

        // If the output array is empty, return unknown.
        if (outputArray.length === 0) return 'Unknown';

        // If the output array is by itself, print the only element
        if (outputArray.length < 2) return outputArray[0];

        // Remove the last element from the array
        const last = outputArray.pop();
        return outputArray.join(', ') + ' and ' + last;
    }

    /**
     * Log to a webhook
     * @param {string | Discord.MessageEmbed} message 
     * @param {string[]} files 
     */
    static log(message: string | Discord.MessageEmbed, files?: string[]) : boolean {
        if (!message) return false;

        if (!(message instanceof Discord.MessageEmbed)) console.log(message.replace(/`/g, '').trim());

        let url = process.env.LOG_WEBHOOK_URL;
        if (!url) return false;

        url = url.replace('https://discordapp.com/api/webhooks/', '').replace('https://discord.com/api/webhooks/', '');
        const split = url.split('/');
        if (split.length < 2) return false;

        const client = new Discord.WebhookClient(split[0] as Snowflake, split[1]);

        if (typeof message == 'string') {
            for (const msg of Discord.Util.splitMessage(message, { maxLength: 1980 })) {
                client.send({ content: msg, avatarURL: process.showdown.user?.displayAvatarURL(), username: 'Showdown! logs', files: files });
            }
        }
        else client.send({ embeds: [message], avatarURL: process.showdown.user?.displayAvatarURL(), username: 'Showdown! logs', files: files });
        
        return true;
    }

    static fetchJSON(url: string) : Promise<unknown> {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            if (!url || typeof url != 'string') return reject('No URL');

            try {
                const res = await fetch(url);
                resolve(await res.json());
            }
    
            catch (e) { reject(e); }
        });
        
    }

    static truncate(str: string, length: number, useWordBoundary: boolean): string {
        if (str.length <= length) return str;
        const subString = str.substr(0, length - 1);
        return (useWordBoundary ? subString.substr(0, subString.lastIndexOf(' ')) : subString) + '...';
    }

    static normalize(num: number): string {
        if (num == undefined || typeof num != 'number') return '';

        return num.toLocaleString(undefined, {minimumIntegerDigits: 2, useGrouping: false});
    }

    static Split<T>(arr: T[], chunks: number): T[][] {
        const array_of_arrays = [];

        for (let i = 0; i < arr.length; i += chunks) {
            array_of_arrays.push(arr.slice(i, i + chunks));
        }

        return array_of_arrays;
    }

    static LoadCommands(): Promise<void> {
        return new Promise((resolve, reject) => {
            const start = process.hrtime.bigint();
    
            recursive('./cmds', async (err, files) => {
                if (err) {
                    Util.log('Error while reading commands:\n' + err);
                    return reject(err);
                }
        
                const jsfiles = files.filter(fileName => fileName.endsWith('.js') && !path.basename(fileName).startsWith('_'));
                if (jsfiles.length < 1) {
                    console.log('No commands to load!');
                    return reject('No commmands');
                }
    
                console.log(`Found ${jsfiles.length} commands`);
    
                for (const file_path of jsfiles) {
                    const cmd_start = process.hrtime.bigint();
    
                    const props: Command = await import(`./${file_path}`);
                    
                    process.showdown.commands.set(props.data.name, props);
            
                    const cmd_end = process.hrtime.bigint();
                    const took = (cmd_end - cmd_start) / BigInt('1000000');
            
                    console.log(`${Util.normalize(jsfiles.indexOf(file_path) + 1)} - ${file_path} loaded in ${took}ms`);
                }
        
                const end = process.hrtime.bigint();
                const took = (end - start) / BigInt('1000000');
                Util.log(`All commands loaded in \`${took}ms\``);

                resolve();
            });
        });
    }

    static async DeployCommands(): Promise<void | boolean> {
        const global: Collection<string, ApplicationCommandData> = new Collection();

        const files = await recursive('./cmds').catch(err => Util.log('Error while reading commands:\n' + err));
        if (!Array.isArray(files)) return; //in case it somehow fails the catch block will return a boolean

        const jsfiles = files.filter(fileName => fileName.endsWith('.js') && !path.basename(fileName).startsWith('_'));
        if (jsfiles.length < 1) {
            return Util.log('No commands to load!');
        }

        for (const file_path of jsfiles) {
            const props: Command = await import(`./${file_path}`);
            
            global.set(props.data.name, props.data);
        }

        if (process.showdown.user?.id === '1') {
            const globalcmds = await process.showdown.application?.commands.fetch();

            if (!globalcmds) {
                await process.showdown.application?.commands.set(global.array());
                return Util.log('Application Commands deployed!');
            }


            if (globalcmds?.size !== global.size) {
                if (globalcmds?.size !== global.size) {
                    await process.showdown.application?.commands.set(global.array());
                    return Util.log('Application Commands deployed!');
                }
            }
            
            else {
                const globallocalhash = Md5((JSON.stringify(global.map(x => x.options).filter(x => x !== undefined && (x as unknown as boolean) !== Array.isArray(x) && x.length))));
                const globalhash = Md5((JSON.stringify(globalcmds.map(x => x.options).filter(x => x !== undefined && (x as unknown as boolean) !== Array.isArray(x) && x.length))));

                if (globallocalhash !== globalhash) await process.showdown.application?.commands.set(global.array());
                return Util.log('Application Commands deployed!');
            }
        }

        else if (process.showdown.user?.id === '847595833347801118') { 
            await process.showdown.guilds.cache.get('709061970078335027')?.commands.set(global.array());
            return Util.log('Application Commands deployed!');
        }
    }

    static LoadEvents(): Promise<void> {
        return new Promise((resolve, reject) => {
            const start = process.hrtime.bigint();
    
            recursive('./events', async (err, files) => {
                if (err) {
                    Util.log('Error while reading events:\n' + err);
                    return reject(err);
                }
            
                const jsfiles = files.filter(fileName => fileName.endsWith('.js') && !path.basename(fileName).startsWith('_'));
                if (jsfiles.length < 1) {
                    console.log('No events to load!');
                    return reject('No events!');
                }
        
                console.log(`Found ${jsfiles.length} events`);
        
                for (const file_path of jsfiles) {
                    const start = process.hrtime.bigint();
        
                    const props = await import(`./${file_path}`);
                        
                    process.showdown.events.set(props.default.name, props.default);
                
                    const end = process.hrtime.bigint();
                    const took = (end - start) / BigInt('1000000');
                
                    console.log(`${Util.normalize(jsfiles.indexOf(file_path) + 1)} - ${file_path} loaded in ${took}ms`);
                }
            
                const end = process.hrtime.bigint();
                const took = (end - start) / BigInt('1000000');
                Util.log(`All events loaded in \`${took}ms\``);
                resolve();
            });
        });
    }
}

export default Util;