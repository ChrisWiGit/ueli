import { join } from "path";

import { getExtensionSettingKey } from "@common/Core/Extension";
import type { FileSystemUtility } from "@Core/FileSystemUtility";
import type { Logger } from "@Core/Logger";
import type { SettingsManager } from "@Core/SettingsManager";

import type { FileSearcher, FileSearchOptions } from "../FileSearcher";
import { hasFilter } from "../parseSearchTerm";
import type { ExecuteFile } from "./executeFile";

/**
 * Searches files with `ffs`, the command line program of FPC File Search.
 */
export class LinuxFileSearcher implements FileSearcher {
    public constructor(
        private readonly settingsManager: SettingsManager,
        private readonly fileSystemUtility: FileSystemUtility,
        private readonly logger: Logger,
        private readonly executeFile: ExecuteFile,
        private readonly homeDirectoryPath: string,
    ) {}

    public async getFilePathsBySearchTerm(
        searchTerm: string,
        maxSearchResultCount: number,
        options: FileSearchOptions = {},
    ): Promise<string[]> {
        // Without a search term ffs lists everything that matches the filters, so at least one filter is needed.
        if (searchTerm.trim().length === 0 && !hasFilter(options)) {
            return [];
        }

        const ffsFilePath = this.getFfsFilePath();
        const args = this.getArguments(searchTerm.trim(), maxSearchResultCount, options);

        try {
            const { stdout, exitCode } = await this.executeFile(ffsFilePath, args);

            // 0 = results found, 1 = no results, everything else is an error
            if (exitCode === 1) {
                return [];
            }

            if (exitCode !== 0) {
                this.logger.error(`ffs failed with exit code ${exitCode}. File path: "${ffsFilePath}"`);
                return [];
            }

            return LinuxFileSearcher.parseOutput(stdout);
        } catch (error) {
            this.logger.error(`Unable to run ffs. File path: "${ffsFilePath}". Reason: ${error}`);
            return [];
        }
    }

    public getArguments(searchTerm: string, maxSearchResultCount: number, options: FileSearchOptions = {}): string[] {
        const args = ["--json", "-q", "-n", `${Math.max(1, Math.floor(maxSearchResultCount))}`];

        // Files and folders by default, a size filter never matches folders anyway
        if (options.type === "folder") {
            args.push("-D");
        } else if (options.type !== "file") {
            args.push("-d");
        }

        if (options.changed) {
            args.push("--changed", options.changed);
        }

        if (options.size) {
            args.push("--size", options.size);
        }

        if (options.kind) {
            args.push("--kind", options.kind);
        }

        if (options.sort) {
            args.push("-s", options.sort);
        }

        if (options.reverse) {
            args.push("-r");
        }

        const folders = options.searchFolders
            ? this.normalizeFolders(options.searchFolders)
            : this.getFolders("ffsSearchFolders");

        // "/" means the whole index, which is the same as no restriction
        if (!folders.includes("/")) {
            for (const folder of folders) {
                args.push("--in", folder);
            }
        }

        for (const folder of this.getFolders("ffsExcludedFolders")) {
            args.push("--exclude", folder);
        }

        // "--" ends the options, so a search term starting with "-" is not taken as an option
        args.push("--");

        if (searchTerm.length > 0) {
            args.push(searchTerm);
        }

        return args;
    }

    public getFfsFilePath(): string {
        const configuredFilePath = this.settingsManager.getValue<string>(
            getExtensionSettingKey("FileSearch", "ffsFilePath"),
            "",
        );

        if (configuredFilePath) {
            return configuredFilePath;
        }

        // When started from the desktop menu, ~/.local/bin is often not part of the PATH.
        const localFilePath = join(this.homeDirectoryPath, ".local", "bin", "ffs");

        return this.fileSystemUtility.isAccessibleSync(localFilePath) ? localFilePath : "ffs";
    }

    public static parseOutput(stdout: string): string[] {
        const filePaths: string[] = [];

        for (const line of stdout.split("\n")) {
            if (line.trim().length === 0) {
                continue;
            }

            try {
                const { path } = JSON.parse(line) as { path?: unknown };

                // File names which are not valid UTF-8 only have "path_b64" and are skipped
                if (typeof path === "string" && path.length > 0) {
                    filePaths.push(path);
                }
            } catch {
                // Ignore lines that are not valid JSON
            }
        }

        return filePaths;
    }

    private getFolders(key: "ffsSearchFolders" | "ffsExcludedFolders"): string[] {
        const folders = this.settingsManager.getValue<string[]>(getExtensionSettingKey("FileSearch", key), []);

        return Array.isArray(folders) ? this.normalizeFolders(folders) : [];
    }

    /**
     * Removes empty entries and replaces a leading `~` by the home folder.
     */
    private normalizeFolders(folders: string[]): string[] {
        return folders
            .map((folder) => `${folder}`.trim())
            .filter((folder) => folder.length > 0)
            .map((folder) =>
                folder === "~" || folder.startsWith("~/") ? join(this.homeDirectoryPath, folder.substring(1)) : folder,
            );
    }
}
