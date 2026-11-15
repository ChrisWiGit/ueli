/**
 * Options for a single search. Searchers that don't support an option ignore it.
 */
export type FileSearchOptions = {
    /**
     * Only these folders are searched instead of the configured search folders. `~` is the home folder, `/` means
     * everywhere.
     */
    searchFolders?: string[];

    /**
     * Modification time, e.g. `today`, `yesterday`, `7d`, `2h`, `year`, `2025-01-01..2025-03-31`.
     */
    changed?: string;

    /**
     * File size, e.g. `+10M`, `-100K`, `0`, `1M..10M`.
     */
    size?: string;

    kind?: FileSearchKind;
    type?: "file" | "folder";
    sort?: FileSearchSortKey;
    reverse?: boolean;
};

export const fileSearchKinds = ["docs", "images", "audio", "video", "archives", "source", "programs"] as const;
export type FileSearchKind = (typeof fileSearchKinds)[number];

export const fileSearchSortKeys = ["name", "path", "size", "time"] as const;
export type FileSearchSortKey = (typeof fileSearchSortKeys)[number];

export interface FileSearcher {
    getFilePathsBySearchTerm(
        searchTerm: string,
        maxSearchResultCount: number,
        options?: FileSearchOptions,
    ): Promise<string[]>;
}
