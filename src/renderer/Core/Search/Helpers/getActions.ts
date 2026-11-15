import {
    createAddToFavoritesAction,
    createExcludeFromSearchResultsAction,
    createRemoveFromFavoritesAction,
    type SearchResultItem,
    type SearchResultItemAction,
} from "@common/Core";

export const getActions = (
    searchResultItem: SearchResultItem,
    favorites: string[],
    keyboardShortcuts: Record<"addToFavorites" | "excludeFromSearchResults", string>,
    includeDefaultAdditionalActions = true,
): SearchResultItemAction[] => {
    // Items which are not part of the search index (e.g. async file search results) can neither be a favorite nor
    // be excluded, because both only apply to the search index.
    if (!includeDefaultAdditionalActions) {
        return [
            { ...searchResultItem.defaultAction, keyboardShortcut: "Enter" },
            ...(searchResultItem.additionalActions ?? []),
        ];
    }

    const defaultAdditionalActions = [
        favorites.includes(searchResultItem.id)
            ? createRemoveFromFavoritesAction({
                  id: searchResultItem.id,
                  keyboardShortcut: keyboardShortcuts.addToFavorites,
              })
            : createAddToFavoritesAction({
                  id: searchResultItem.id,
                  keyboardShortcut: keyboardShortcuts.addToFavorites,
              }),
        createExcludeFromSearchResultsAction({
            id: searchResultItem.id,
            keyboardShortcut: keyboardShortcuts.excludeFromSearchResults,
        }),
    ];

    return [
        { ...searchResultItem.defaultAction, keyboardShortcut: "Enter" },
        ...(searchResultItem.additionalActions ?? []),
        ...defaultAdditionalActions,
    ];
};
