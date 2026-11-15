import { execFile } from "child_process";

export type ExecuteFileResult = { stdout: string; exitCode: number };

export type ExecuteFile = (filePath: string, args: string[]) => Promise<ExecuteFileResult>;

/**
 * Runs a program without a shell, so the arguments need no quoting. Resolves with the exit code instead of rejecting on
 * a non-zero exit code. Rejects if the program could not be started or was killed (e.g. by the timeout).
 */
export const executeFile: ExecuteFile = (filePath, args) =>
    new Promise((resolve, reject) => {
        execFile(filePath, args, { timeout: 5000, maxBuffer: 16 * 1024 * 1024 }, (error, stdout) => {
            if (!error) {
                resolve({ stdout, exitCode: 0 });
            } else if (typeof error.code === "number" && !error.killed) {
                resolve({ stdout, exitCode: error.code });
            } else {
                reject(error);
            }
        });
    });
