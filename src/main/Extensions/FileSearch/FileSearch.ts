import { basename, dirname } from "path";

import {
    createInvokeExtensionAction,
    createOpenFileAction,
    type AsyncSearchResultItems,
    type OperatingSystem,
    type SearchResultItem,
    type SearchResultItemAction,
} from "@common/Core";
import { getExtensionSettingKey } from "@common/Core/Extension";
import type { Image } from "@common/Core/Image";
import type { AssetPathResolver } from "@Core/AssetPathResolver";
import type { Extension } from "@Core/Extension";
import type { FileSystemUtility } from "@Core/FileSystemUtility";
import type { Logger } from "@Core/Logger";
import type { SettingsManager } from "@Core/SettingsManager";
import type { Translator } from "@Core/Translator";
import type { App } from "electron";

import type { FileSearcher } from "./FileSearcher";
import { hasFilter, parseSearchTerm } from "./parseSearchTerm";
import type { Settings } from "./Settings";

export class FileSearch implements Extension {
    public readonly id = "FileSearch";
    public readonly name = "File Search";

    public readonly nameTranslation = {
        key: "extensionName",
        namespace: "extension[FileSearch]",
    };

    public readonly author = {
        name: "Oliver Schwendener",
        githubUserName: "oliverschwendener",
    };

    private readonly defaultSettings: Settings = {
        maxSearchResultCount: 20,
        everythingCliFilePath: "",
        ffsFilePath: "",
        ffsSearchFolders: [],
        ffsExcludedFolders: [],
        prefix: "f",
        includeInMainSearch: true,
        mainSearchMaxResultCount: 8,
        mainSearchMinTermLength: 3,
    };

    public constructor(
        private readonly operatingSystem: OperatingSystem,
        private readonly assetPathResolver: AssetPathResolver,
        private readonly fileSystemUtility: FileSystemUtility,
        private readonly settingsManager: SettingsManager,
        private readonly app: App,
        private readonly logger: Logger,
        private readonly translator: Translator,
        private readonly fileSearcher: FileSearcher,
    ) {}

    public async getSearchResultItems(): Promise<SearchResultItem[]> {
        const { t } = this.translator.createT(this.getI18nResources());

        return [
            {
                defaultAction: createInvokeExtensionAction({
                    extensionId: this.id,
                    description: "Search files",
                }),
                description: t("extensionName"),
                id: "file-search:invoke",
                image: this.getImage(),
                name: t("searchResultItemName"),
            },
        ];
    }

    public isSupported(): boolean {
        return true;
    }

    public getSettingDefaultValue(key: keyof Settings) {
        return this.defaultSettings[key];
    }

    public getImage(): Image {
        const fileNames: Record<OperatingSystem, string> = {
            Linux: "macos-folder-icon.png",
            macOS: "macos-folder-icon.png",
            Windows: "macos-folder-icon.png",
        };

        return {
            url: `file://${this.assetPathResolver.getExtensionAssetPath(this.id, fileNames[this.operatingSystem])}`,
        };
    }

    public getI18nResources() {
        return {
            "en-US": {
                extensionName: "File Search",
                esFilePath: "Everything CLI file path",
                fileDoesNotExist: "File does not exist",
                maxSearchResults: "Max search results",
                searchResultItemName: "Search files",
                ffsFilePath: "ffs file path",
                ffsFilePathDescription: "Command line program of FPC File Search. Empty = find automatically",
                ffsSearchFolders: "Search folders",
                ffsSearchFoldersDescription: "One folder per line, ~ is the home folder. Empty = whole index",
                ffsExcludedFolders: "Excluded folders",
                ffsExcludedFoldersDescription: "One folder per line",
                prefix: "Prefix",
                prefixDescription:
                    "Search files only in the main search: <prefix> <search term>. Options: n:50, ~ or in:~/folder, in:/ (everywhere), changed:today, size:+10M, kind:docs, type:folder, sort:-time",
                includeInMainSearch: "Show files in the main search",
                mainSearchMaxResults: "Max file results in the main search",
                mainSearchMinTermLength: "Min search term length for files in the main search",
                helpTitle: "File search: what you can type",
                helpPrefix: "search files only",
                helpAllParts: "both parts in the name",
                helpWildcards: "wildcards, file extensions",
                helpExclude: "exclude names containing tmp",
                helpPath: "a part with / applies to the path",
                helpFolder: "only below this folder",
                helpEverywhere: "everywhere",
                helpMaxResults: "up to 50 results",
                helpChanged: "changed today, in 7 days, in 2 hours",
                helpSize: "larger, smaller, between",
                helpKind: "docs, images, audio, video, archives, source, programs",
                helpType: "folders only, files only",
                helpSort: "newest first, largest first (name, path, size, time)",
            },
            "de-CH": {
                extensionName: "Dateisuche",
                esFilePath: "Everything CLI-Dateipfad",
                fileDoesNotExist: "File does not exist",
                maxSearchResults: "Maximale Suchergebnisse",
                searchResultItemName: "Dateien suchen",
                ffsFilePath: "ffs-Dateipfad",
                ffsFilePathDescription: "Kommandozeilenprogramm von FPC File Search. Leer = automatisch finden",
                ffsSearchFolders: "Suchordner",
                ffsSearchFoldersDescription: "Ein Ordner pro Zeile, ~ ist der Home-Ordner. Leer = ganzer Index",
                ffsExcludedFolders: "Ausgeschlossene Ordner",
                ffsExcludedFoldersDescription: "Ein Ordner pro Zeile",
                prefix: "Präfix",
                prefixDescription:
                    "Nur Dateien in der Hauptsuche suchen: <Präfix> <Suchbegriff>. Optionen: n:50, ~ oder in:~/ordner, in:/ (überall), changed:today, size:+10M, kind:docs, type:folder, sort:-time",
                includeInMainSearch: "Dateien in der Hauptsuche anzeigen",
                mainSearchMaxResults: "Maximale Dateitreffer in der Hauptsuche",
                mainSearchMinTermLength: "Mindestlänge des Suchbegriffs für Dateien in der Hauptsuche",
                helpTitle: "Dateisuche: mögliche Eingaben",
                helpPrefix: "nur Dateien suchen",
                helpAllParts: "beide Teile im Namen",
                helpWildcards: "Platzhalter, Endungen",
                helpExclude: "Namen mit tmp ausschliessen",
                helpPath: "ein Teil mit / gilt für den Pfad",
                helpFolder: "nur unterhalb dieses Ordners",
                helpEverywhere: "überall",
                helpMaxResults: "bis zu 50 Treffer",
                helpChanged: "geändert heute, in 7 Tagen, in 2 Stunden",
                helpSize: "grösser, kleiner, zwischen",
                helpKind: "docs, images, audio, video, archives, source, programs",
                helpType: "nur Ordner, nur Dateien",
                helpSort: "neueste zuerst, grösste zuerst (name, path, size, time)",
            },
            "ja-JP": {
                extensionName: "ファイル検索",
                esFilePath: "すべてCLIのファイルパスにする",
                fileDoesNotExist: "ファイルが見付かりません",
                maxSearchResults: "検索上限数",
                searchResultItemName: "ファイル検索 | Search files",
                ffsFilePath: "ffs file path",
                ffsFilePathDescription: "Command line program of FPC File Search. Empty = find automatically",
                ffsSearchFolders: "Search folders",
                ffsSearchFoldersDescription: "One folder per line, ~ is the home folder. Empty = whole index",
                ffsExcludedFolders: "Excluded folders",
                ffsExcludedFoldersDescription: "One folder per line",
                prefix: "Prefix",
                prefixDescription:
                    "Search files only in the main search: <prefix> <search term>. Add n:50 for up to 50 results",
                includeInMainSearch: "Show files in the main search",
                mainSearchMaxResults: "Max file results in the main search",
                mainSearchMinTermLength: "Min search term length for files in the main search",
                helpTitle: "File search: what you can type",
                helpPrefix: "search files only",
                helpAllParts: "both parts in the name",
                helpWildcards: "wildcards, file extensions",
                helpExclude: "exclude names containing tmp",
                helpPath: "a part with / applies to the path",
                helpFolder: "only below this folder",
                helpEverywhere: "everywhere",
                helpMaxResults: "up to 50 results",
                helpChanged: "changed today, in 7 days, in 2 hours",
                helpSize: "larger, smaller, between",
                helpKind: "docs, images, audio, video, archives, source, programs",
                helpType: "folders only, files only",
                helpSort: "newest first, largest first (name, path, size, time)",
            },
            "ko-KR": {
                extensionName: "파일 검색",
                esFilePath: "Everything CLI 파일 경로",
                fileDoesNotExist: "파일이 존재하지 않습니다",
                maxSearchResults: "최대 검색 결과",
                searchResultItemName: "파일 검색하기",
                ffsFilePath: "ffs file path",
                ffsFilePathDescription: "Command line program of FPC File Search. Empty = find automatically",
                ffsSearchFolders: "Search folders",
                ffsSearchFoldersDescription: "One folder per line, ~ is the home folder. Empty = whole index",
                ffsExcludedFolders: "Excluded folders",
                ffsExcludedFoldersDescription: "One folder per line",
                prefix: "Prefix",
                prefixDescription:
                    "Search files only in the main search: <prefix> <search term>. Add n:50 for up to 50 results",
                includeInMainSearch: "Show files in the main search",
                mainSearchMaxResults: "Max file results in the main search",
                mainSearchMinTermLength: "Min search term length for files in the main search",
                helpTitle: "File search: what you can type",
                helpPrefix: "search files only",
                helpAllParts: "both parts in the name",
                helpWildcards: "wildcards, file extensions",
                helpExclude: "exclude names containing tmp",
                helpPath: "a part with / applies to the path",
                helpFolder: "only below this folder",
                helpEverywhere: "everywhere",
                helpMaxResults: "up to 50 results",
                helpChanged: "changed today, in 7 days, in 2 hours",
                helpSize: "larger, smaller, between",
                helpKind: "docs, images, audio, video, archives, source, programs",
                helpType: "folders only, files only",
                helpSort: "newest first, largest first (name, path, size, time)",
            },
        };
    }

    public getSettingKeysTriggeringRescan?(): string[] {
        return ["general.settings"];
    }

    public async invoke({ searchTerm }: { searchTerm: string }): Promise<SearchResultItem[]> {
        return await this.search(searchTerm, this.getMaxSearchResultCount());
    }

    /**
     * Provides the file search results for the main search window (Linux only for now):
     * - `<prefix> <search term>` searches files only,
     * - any other search term adds a few file search results below the regular search results.
     */
    public async getAsyncSearchResultItems(searchTerm: string): Promise<AsyncSearchResultItems> {
        if (this.operatingSystem !== "Linux") {
            return { items: [], exclusive: false };
        }

        const prefix = this.getSettingValue("prefix").trim();

        if (prefix.length > 0 && searchTerm.startsWith(`${prefix} `)) {
            return {
                items: await this.search(searchTerm.substring(prefix.length + 1), this.getMaxSearchResultCount()),
                exclusive: true,
            };
        }

        if (
            !this.getSettingValue("includeInMainSearch") ||
            parseSearchTerm(searchTerm).searchTerm.length < this.getSettingValue("mainSearchMinTermLength")
        ) {
            return { items: [], exclusive: false };
        }

        return {
            items: await this.search(searchTerm, this.getSettingValue("mainSearchMaxResultCount")),
            exclusive: false,
        };
    }

    private getSettingValue<Key extends keyof Settings>(key: Key): Settings[Key] {
        return this.settingsManager.getValue(getExtensionSettingKey(this.id, key), this.defaultSettings[key]);
    }

    /**
     * Searches files. The token `n:<number>` in the search term overrides the default maximum number of results.
     */
    private async search(rawSearchTerm: string, defaultMaxSearchResultCount: number): Promise<SearchResultItem[]> {
        const { searchTerm, maxSearchResultCount, options } = parseSearchTerm(rawSearchTerm);

        if (searchTerm.length === 0 && !hasFilter(options)) {
            return [];
        }

        const filePaths = await this.fileSearcher.getFilePathsBySearchTerm(
            searchTerm,
            maxSearchResultCount ?? defaultMaxSearchResultCount,
            options,
        );
        const filePathIconMap = await this.getFileIconMap(filePaths);

        return filePaths.map((filePath) => {
            const isDirectory =
                this.fileSystemUtility.isAccessibleSync(filePath) && this.fileSystemUtility.isDirectory(filePath);

            const additionalActions: SearchResultItemAction[] = [];

            if (!isDirectory) {
                additionalActions.push(
                    createOpenFileAction({
                        filePath: dirname(filePath),
                        description: `Open Folder`,
                        keyboardShortcut: "Shift+Enter",
                    }),
                );
            }

            return {
                defaultAction: createOpenFileAction({
                    filePath,
                    description: `Open ${isDirectory ? "Folder" : "File"}`,
                }),
                additionalActions: additionalActions,
                description: isDirectory ? "Folder" : "File",
                details: dirname(filePath),
                showDetailsInCompactLayout: true,
                dragAndDrop: { filePath },
                id: `file-search-result:${Buffer.from(filePath).toString("base64")}`,
                image: filePathIconMap[filePath] ? { url: filePathIconMap[filePath] } : this.getImage(),
                name: basename(filePath),
            };
        });
    }

    private getMaxSearchResultCount(): number {
        return this.settingsManager.getValue(
            getExtensionSettingKey(this.id, "maxSearchResultCount"),
            this.defaultSettings.maxSearchResultCount,
        );
    }

    private async getFileIconMap(filePaths: string[]): Promise<Record<string, string>> {
        const result: Record<string, string> = {};
        const promiseResults = await Promise.allSettled(filePaths.map((filePath) => this.app.getFileIcon(filePath)));

        for (let i = 0; i < promiseResults.length; i++) {
            const promiseResult = promiseResults[i];

            if (promiseResult.status === "fulfilled") {
                // On Linux there may be no icon for a file or folder. Then the image of the extension is used.
                if (!promiseResult.value.isEmpty()) {
                    result[filePaths[i]] = promiseResult.value.toDataURL();
                }
            } else if (promiseResult.status === "rejected") {
                this.logger.error(
                    `Failed to generate icon for file path "${filePaths[i]}". Reason: ${promiseResult.reason}`,
                );
            }
        }

        return result;
    }
}
