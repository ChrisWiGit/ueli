import type { SearchResultItem } from "./SearchResultItem";

/**
 * Search result items which are resolved asynchronously for the current search term, e.g. by asking an external
 * program. They are shown in their own group below the regular search results.
 */
export type AsyncSearchResultItems = {
    items: SearchResultItem[];

    /**
     * If `true`, only these items are shown and the regular search results are hidden, e.g. when the search term
     * starts with the prefix of an extension.
     */
    exclusive: boolean;
};
