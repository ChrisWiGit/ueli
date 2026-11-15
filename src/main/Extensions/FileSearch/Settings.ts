export type Settings = {
    maxSearchResultCount: number;
    everythingCliFilePath: string;
    ffsFilePath: string;
    ffsSearchFolders: string[];
    ffsExcludedFolders: string[];
    prefix: string;
    includeInMainSearch: boolean;
    mainSearchMaxResultCount: number;
    mainSearchMinTermLength: number;
};
