/*
 * Copyright © 2018 Atomist, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {
    ChildProcess,
    spawn,
    SpawnOptions,
} from "child_process";
import * as path from "path";

import { sprintf } from "sprintf-js";

import * as strip_ansi from "strip-ansi";
import { logger } from "../internal/util/logger";

export interface WritableLog {

    /**
     * Some implementations expose their log as a string.
     * Others may not, as it could be too long etc.
     */
    log?: string;

    write(what: string): void;
}

/**
 * Type that can react to the exit of a spawned child process, after
 * Node has terminated without reporting an error.
 * This is necessary only for commands that can return
 * a non-zero exit code on success.
 * @return whether this result should be considered an error.
 */
export type ErrorFinder = (code: number, signal: string, log: WritableLog) => boolean;

/**
 * Default ErrorFinder that regards return code 0 as success
 * @param {number} code
 * @return {boolean}
 * @constructor
 */
export const SuccessIsReturn0ErrorFinder: ErrorFinder = code => code !== 0;

export interface ChildProcessResult {
    error: boolean;
    code: number;
    message?: string;
}

export interface SpawnWatchOptions {
    errorFinder: ErrorFinder;
    stripAnsi: boolean;
    timeout: number;
    logCommand: boolean;
}

/**
 * Spawn a process and watch
 * @param {SpawnCommand} spawnCommand
 * @param options options
 * @param {ProgressLog} log
 * @param {Partial<SpawnWatchOptions>} spOpts
 * @return {Promise<ChildProcessResult>}
 */
export async function spawnAndWatch(spawnCommand: SpawnCommand,
                                    options: SpawnOptions,
                                    log: WritableLog,
                                    spOpts: Partial<SpawnWatchOptions> = {}): Promise<ChildProcessResult> {
    const childProcess = spawn(spawnCommand.command, spawnCommand.args || [], options);
    if (spOpts.logCommand === false) {
        logger.debug(`${options.cwd || path.resolve(".")} > ${stringifySpawnCommand(spawnCommand)} (pid '${childProcess.pid}')`);
    } else {
        log.write(`${options.cwd || path.resolve(".")} > ${stringifySpawnCommand(spawnCommand)} (pid '${childProcess.pid}')`);
    }
    return watchSpawned(childProcess, log, spOpts);
}

/**
 * Handle the result of a spawned process, streaming back
 * output to log
 * @param childProcess
 * @param {ProgressLog} log to write stdout and stderr to
 * @param opts: Options for error parsing, ANSI code stripping etc.
 * @return {Promise<ChildProcessResult>}
 */
function watchSpawned(childProcess: ChildProcess,
                      log: WritableLog,
                      opts: Partial<SpawnWatchOptions> = {}): Promise<ChildProcessResult> {
    let timer;
    let running = true;
    if (opts.timeout) {
        timer = setTimeout(() => {
            if (running) {
                logger.warn("Spawn timeout expired. Killing command with pid '%s'", childProcess.pid);
                childProcess.kill();
            }
        }, opts.timeout);
    }

    return new Promise<ChildProcessResult>((resolve, reject) => {
        const optsToUse = {
            errorFinder: SuccessIsReturn0ErrorFinder,
            stripAnsi: false,
            ...opts,
        };
        if (!optsToUse.errorFinder) {
            // The caller specified undefined, which is an error. Ignore them, for they know not what they do.
            optsToUse.errorFinder = SuccessIsReturn0ErrorFinder;
        }

        function sendToLog(data) {
            const formatted = optsToUse.stripAnsi ? strip_ansi(data.toString()) : data.toString();
            return log.write(formatted);
        }

        childProcess.stdout.on("data", sendToLog);
        childProcess.stderr.on("data", sendToLog);
        childProcess.addListener("exit", (code, signal) => {
            running = false;
            logger.info("Spawn exit with pid '%d': code '%d', signal '%d'", childProcess.pid, code, signal);
            clearTimeout(timer);
            resolve({
                error: optsToUse.errorFinder(code, signal, log),
                code,
            });
        });
        childProcess.addListener("error", err => {
            running = false;
            // Process could not be spawned or killed
            logger.warn("Spawn failure: %s", err);
            clearTimeout(timer);
            reject(err);
        });
    });
}

/**
 * The first two arguments to Node spawn
 */
export interface SpawnCommand {

    command: string;
    args?: string[];
    options?: any;
}

/**
 * toString for a SpawnCommand. Used for logging.
 * @param {SpawnCommand} sc
 * @return {string}
 */
export function stringifySpawnCommand(sc: SpawnCommand): string {
    return sprintf("%s %s", sc.command, !!sc.args ? sc.args.join(" ") : "");
}

/**
 * Convenient function to create a spawn command from a sentence such as "npm run compile"
 * Does not respect quoted arguments
 * @param {string} sentence
 * @param options
 * @return {SpawnCommand}
 */
export function asSpawnCommand(sentence: string, options: SpawnOptions = {}): SpawnCommand {
    const split = sentence.split(" ");
    return {
        command: split[0],
        args: split.slice(1),
        options,
    };
}

/**
 * Kill the child process and wait for it to shut down. This can take a while as child processes
 * may have shut down hooks.
 * @param {module:child_process.ChildProcess} childProcess
 * @return {Promise<any>}
 */
export function poisonAndWait(childProcess: ChildProcess): Promise<any> {
    childProcess.kill();
    return new Promise((resolve, reject) => childProcess.on("close", () => {
        resolve();
    }));
}
