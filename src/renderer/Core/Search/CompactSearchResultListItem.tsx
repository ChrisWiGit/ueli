import type { SearchResultItem } from "@common/Core";
import { Text } from "@fluentui/react-components";

import { SearchResultItemDescriptionBadge } from "./SearchResultItemDescriptionBadge";
import { SearchResultItemImage } from "./SearchResultItemImage";

type CompactSearchResultListItemProps = {
    searchResultItem: SearchResultItem;
};

export const CompactSearchResultListItem = ({ searchResultItem }: CompactSearchResultListItemProps) => {
    const showDetails = searchResultItem.showDetailsInCompactLayout === true && !!searchResultItem.details;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 8,
                boxSizing: "border-box",
                gap: 8,
                width: "100%",
            }}
        >
            <div style={{ flexShrink: 0 }}>
                <SearchResultItemImage image={searchResultItem.image} altText={searchResultItem.name} size={20} />
            </div>
            <div style={{ flexGrow: 1, display: "flex", alignItems: "baseline", gap: 8, minWidth: 0 }}>
                <Text
                    style={{
                        flexShrink: showDetails ? 0 : 1,
                        maxWidth: showDetails ? "60%" : undefined,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {searchResultItem.name}
                </Text>
                {showDetails && (
                    <Text
                        size={200}
                        title={searchResultItem.details}
                        style={{
                            flexShrink: 1,
                            minWidth: 0,
                            opacity: 0.65,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {searchResultItem.details}
                    </Text>
                )}
            </div>
            <div style={{ flexShrink: 0, display: "flex" }}>
                <SearchResultItemDescriptionBadge searchResultItem={searchResultItem} />
            </div>
        </div>
    );
};
