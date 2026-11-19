import { extname, relative, sep } from "path";

import type { Image } from "@common/Core/Image";
import type { AssetPathResolver } from "@Core/AssetPathResolver";
import type { EnvironmentVariableProvider } from "@Core/EnvironmentVariableProvider";
import type { FileSystemUtility } from "@Core/FileSystemUtility";
import type { FileImageGenerator } from "@Core/ImageGenerator";
import type { IniFileParser } from "@Core/IniFileParser/";
import type { Logger } from "@Core/Logger";

import type { Application } from "../Application";
import type { ApplicationRepository } from "../ApplicationRepository";
import type { Settings } from "../Settings";
import { LinuxApplication } from "./LinuxApplication";

export class LinuxApplicationRepository implements ApplicationRepository {
    public constructor(
        private readonly fileSystemUtility: FileSystemUtility,
        private readonly fileImageGenerator: FileImageGenerator,
        private readonly iniParser: IniFileParser,
        private readonly environmentVariableProvider: EnvironmentVariableProvider,
        private readonly assetPathResolver: AssetPathResolver,
        private readonly logger: Logger,
        private readonly settings: Settings,
    ) {}

    public async getApplications(): Promise<Application[]> {
        const folderPaths = this.getExistingFolderPaths(this.settings.getValue<string[]>("linuxFolders"));

        const filePaths = await this.getApplicationFilePaths(folderPaths);

        return await this.generateLinuxApplications(filePaths);
    }

    private getExistingFolderPaths(candidates: string[]): string[] {
        const existingFolderPaths: string[] = [];

        for (const candidate of candidates) {
            if (this.fileSystemUtility.isDirectory(candidate)) {
                existingFolderPaths.push(candidate);
            } else {
                this.logger.warn(
                    `Unable to get applications from folder "${candidate}". Reason: path doesn't exist or isn't a folder`,
                );
            }
        }

        return existingFolderPaths;
    }

    /**
     * Reads the folders including their subfolders. If several folders contain a file with the same desktop file ID
     * (e.g. a user specific override in ~/.local/share/applications), only the file of the first folder is used, see
     * https://specifications.freedesktop.org/desktop-entry-spec/latest/file-naming.html
     */
    private async getApplicationFilePaths(folderPaths: string[]): Promise<string[]> {
        const uniqueFolderPaths = [...new Set(folderPaths)];

        const readDirectoryPromiseResults = await Promise.allSettled(
            uniqueFolderPaths.map((folderPath) => this.fileSystemUtility.readDirectory(folderPath, true)),
        );

        const filePathsByDesktopFileId = new Map<string, string>();

        for (let i = 0; i < readDirectoryPromiseResults.length; i++) {
            const readDirectoryPromiseResult = readDirectoryPromiseResults[i];

            if (readDirectoryPromiseResult.status === "rejected") {
                this.logger.error(readDirectoryPromiseResult.reason);
                continue;
            }

            for (const filePath of readDirectoryPromiseResult.value) {
                if (extname(filePath) !== ".desktop") {
                    continue;
                }

                const desktopFileId = relative(uniqueFolderPaths[i], filePath).split(sep).join("-");

                if (!filePathsByDesktopFileId.has(desktopFileId)) {
                    filePathsByDesktopFileId.set(desktopFileId, filePath);
                }
            }
        }

        return [...filePathsByDesktopFileId.values()];
    }

    private async generateLinuxApplications(filePaths: string[]): Promise<LinuxApplication[]> {
        const applicationPromiseResults = await Promise.allSettled(
            filePaths.map((filePath) => this.generateLinuxApplication(filePath)),
        );

        const applications: LinuxApplication[] = [];

        for (let i = 0; i < applicationPromiseResults.length; i++) {
            const filePath = filePaths[i];
            const promiseResult = applicationPromiseResults[i];

            if (promiseResult.status === "fulfilled") {
                if (promiseResult.value) {
                    applications.push(promiseResult.value);
                }
            } else {
                this.logger.error(`Unable to generate Application for ${filePath}. Reason: ${promiseResult.reason}`);
            }
        }

        return applications;
    }

    private async generateLinuxApplication(filePath: string): Promise<LinuxApplication | undefined> {
        const config: Record<string, string> = this.iniParser.parseIniFileContent(
            (await this.fileSystemUtility.readFile(filePath)).toString(),
        )["Desktop Entry"];

        if (!config) {
            throw new Error(`Unable to parse .desktop at ${filePath}`);
        }

        const appName = config["Name"] ?? filePath;

        // https://specifications.freedesktop.org/desktop-entry-spec/desktop-entry-spec-latest.html#recognized-keys
        const desktopEnv = this.environmentVariableProvider.get("ORIGINAL_XDG_CURRENT_DESKTOP")?.split(":") ?? [];

        if (
            (config.NoDisplay && config.NoDisplay.toLowerCase() === "true") ||
            (config.OnlyShowIn && !config.OnlyShowIn.split(";").some((i) => desktopEnv.includes(i))) ||
            (config.NotShowIn && config.NotShowIn.split(";").some((i) => desktopEnv.includes(i))) ||
            (config.Type && config.Type.toLocaleLowerCase() !== "application")
        ) {
            return undefined;
        }

        let appIcon = this.getDefaultAppIcon();

        try {
            appIcon = await this.fileImageGenerator.getImage(filePath);
        } catch (error) {
            this.logger.warn(`Using fallback icon for ${appName}. Reason: ${error}`);
        }

        return new LinuxApplication(appName, filePath, appIcon);
    }

    private getDefaultAppIcon(): Image {
        return {
            url: `file://${this.assetPathResolver.getExtensionAssetPath("ApplicationSearch", "linux-generic-app-icon.png")}`,
        };
    }
}
