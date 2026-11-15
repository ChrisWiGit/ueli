import {
    fileSearchKinds,
    fileSearchSortKeys,
    type FileSearchKind,
    type FileSearchOptions,
    type FileSearchSortKey,
} from "./FileSearcher";

export type ParsedSearchTerm = {
    searchTerm: string;
    maxSearchResultCount?: number;
    options: FileSearchOptions;
};

const changedPattern =
    /^(today|yesterday|year|\d{1,5}[dh]|\d{4}-\d{2}-\d{2}\.\.(\d{4}-\d{2}-\d{2})?|\.\.\d{4}-\d{2}-\d{2})$/;

const sizeValue = "\\d{1,15}[KMGT]?";
const sizePattern = new RegExp(`^([+-]?${sizeValue}|${sizeValue}\\.\\.(${sizeValue})?|\\.\\.${sizeValue})$`, "i");

/**
 * Takes the options out of the search term. Everything else stays the search term.
 *
 * | Token                    | Meaning                                                              |
 * | ------------------------ | -------------------------------------------------------------------- |
 * | `n:50`                   | at most 50 search results                                            |
 * | `~`, `~/folder`          | only below the home folder / this folder (same as `in:`)             |
 * | `in:~/folder`, `in:/etc` | only below this folder, can be given more than once; `in:/` everywhere |
 * | `changed:today`          | modification time: `today`, `yesterday`, `7d`, `2h`, `year`, `2025-01-01..2025-03-31` |
 * | `size:+10M`              | file size: `+10M`, `-100K`, `0`, `1M..10M`                           |
 * | `kind:docs`              | `docs`, `images`, `audio`, `video`, `archives`, `source`, `programs` |
 * | `type:folder`            | `file` or `folder` (also `dir`)                                      |
 * | `sort:time`              | `name`, `path`, `size`, `time`; `sort:-time` reverses the order      |
 *
 * Tokens with an invalid value (`n:0`, `kind:foo`, `in:relative`) stay part of the search term.
 */
export const parseSearchTerm = (searchTerm: string): ParsedSearchTerm => {
    let maxSearchResultCount: number | undefined = undefined;
    const options: FileSearchOptions = {};
    const searchFolders: string[] = [];

    const takeOption = (part: string): boolean => {
        if (part === "~" || part.startsWith("~/")) {
            searchFolders.push(part);
            return true;
        }

        const separatorIndex = part.indexOf(":");

        if (separatorIndex < 1) {
            return false;
        }

        const key = part.substring(0, separatorIndex).toLowerCase();
        const value = part.substring(separatorIndex + 1);

        if (key === "n" && /^[1-9]\d{0,5}$/.test(value)) {
            maxSearchResultCount = Number(value);
            return true;
        }

        if (key === "in" && /^(~|\/)/.test(value)) {
            searchFolders.push(value);
            return true;
        }

        if (key === "changed" && changedPattern.test(value.toLowerCase())) {
            options.changed = value.toLowerCase();
            return true;
        }

        if (key === "size" && sizePattern.test(value)) {
            options.size = value.toUpperCase();
            return true;
        }

        if (key === "kind" && fileSearchKinds.includes(<FileSearchKind>value.toLowerCase())) {
            options.kind = <FileSearchKind>value.toLowerCase();
            return true;
        }

        if (key === "type" && ["file", "folder", "dir"].includes(value.toLowerCase())) {
            options.type = value.toLowerCase() === "file" ? "file" : "folder";
            return true;
        }

        if (key === "sort") {
            const reverse = value.startsWith("-");
            const sortKey = <FileSearchSortKey>(reverse ? value.substring(1) : value).toLowerCase();

            if (fileSearchSortKeys.includes(sortKey)) {
                options.sort = sortKey;
                options.reverse = reverse;
                return true;
            }
        }

        return false;
    };

    const remainingParts = searchTerm
        .split(/\s+/)
        .filter((part) => part.length > 0)
        .filter((part) => !takeOption(part));

    if (searchFolders.length > 0) {
        options.searchFolders = searchFolders;
    }

    return { searchTerm: remainingParts.join(" "), maxSearchResultCount, options };
};

/**
 * Whether the options contain a filter, so that a search without a search term makes sense, e.g. `changed:today`.
 */
export const hasFilter = ({ changed, size, kind }: FileSearchOptions): boolean =>
    changed !== undefined || size !== undefined || kind !== undefined;
