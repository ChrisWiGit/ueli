import { describe, expect, it } from "vitest";

import { hasFilter, parseSearchTerm } from "./parseSearchTerm";

describe(parseSearchTerm, () => {
    it.each([
        ["invoice", { searchTerm: "invoice", maxSearchResultCount: undefined, options: {} }],
        ["invoice n:50", { searchTerm: "invoice", maxSearchResultCount: 50, options: {} }],
        ["n:50 invoice 2024", { searchTerm: "invoice 2024", maxSearchResultCount: 50, options: {} }],
        ["invoice n:5 2024", { searchTerm: "invoice 2024", maxSearchResultCount: 5, options: {} }],
        ["n:50", { searchTerm: "", maxSearchResultCount: 50, options: {} }],
        [
            "  *.pdf   !scan ext:pdf;odt ",
            { searchTerm: "*.pdf !scan ext:pdf;odt", maxSearchResultCount: undefined, options: {} },
        ],

        // Search folders
        ["invoice ~", { searchTerm: "invoice", maxSearchResultCount: undefined, options: { searchFolders: ["~"] } }],
        [
            "~/projects invoice",
            { searchTerm: "invoice", maxSearchResultCount: undefined, options: { searchFolders: ["~/projects"] } },
        ],
        ["invoice in:~", { searchTerm: "invoice", maxSearchResultCount: undefined, options: { searchFolders: ["~"] } }],
        [
            "in:~/projects invoice in:/etc n:5",
            { searchTerm: "invoice", maxSearchResultCount: 5, options: { searchFolders: ["~/projects", "/etc"] } },
        ],
        ["invoice in:/", { searchTerm: "invoice", maxSearchResultCount: undefined, options: { searchFolders: ["/"] } }],

        // Filters
        ["changed:today", { searchTerm: "", maxSearchResultCount: undefined, options: { changed: "today" } }],
        ["a changed:7d", { searchTerm: "a", maxSearchResultCount: undefined, options: { changed: "7d" } }],
        ["a changed:2H", { searchTerm: "a", maxSearchResultCount: undefined, options: { changed: "2h" } }],
        [
            "a changed:2025-01-01..2025-03-31",
            { searchTerm: "a", maxSearchResultCount: undefined, options: { changed: "2025-01-01..2025-03-31" } },
        ],
        [
            "a changed:2025-01-01..",
            { searchTerm: "a", maxSearchResultCount: undefined, options: { changed: "2025-01-01.." } },
        ],
        [
            "a changed:..2025-03-31",
            { searchTerm: "a", maxSearchResultCount: undefined, options: { changed: "..2025-03-31" } },
        ],
        ["a size:+10m", { searchTerm: "a", maxSearchResultCount: undefined, options: { size: "+10M" } }],
        ["a size:-100K", { searchTerm: "a", maxSearchResultCount: undefined, options: { size: "-100K" } }],
        ["a size:0", { searchTerm: "a", maxSearchResultCount: undefined, options: { size: "0" } }],
        ["a size:1M..10M", { searchTerm: "a", maxSearchResultCount: undefined, options: { size: "1M..10M" } }],
        ["a kind:Docs", { searchTerm: "a", maxSearchResultCount: undefined, options: { kind: "docs" } }],
        ["a type:dir", { searchTerm: "a", maxSearchResultCount: undefined, options: { type: "folder" } }],
        ["a type:folder", { searchTerm: "a", maxSearchResultCount: undefined, options: { type: "folder" } }],
        ["a type:file", { searchTerm: "a", maxSearchResultCount: undefined, options: { type: "file" } }],
        [
            "a sort:time",
            { searchTerm: "a", maxSearchResultCount: undefined, options: { sort: "time", reverse: false } },
        ],
        [
            "a sort:-size",
            { searchTerm: "a", maxSearchResultCount: undefined, options: { sort: "size", reverse: true } },
        ],
        [
            "kind:images ~ changed:yesterday sort:-time n:30",
            {
                searchTerm: "",
                maxSearchResultCount: 30,
                options: { kind: "images", searchFolders: ["~"], changed: "yesterday", sort: "time", reverse: true },
            },
        ],

        // Invalid values stay part of the search term
        ["invoice n:0", { searchTerm: "invoice n:0", maxSearchResultCount: undefined, options: {} }],
        ["invoice n:abc", { searchTerm: "invoice n:abc", maxSearchResultCount: undefined, options: {} }],
        ["plan:50", { searchTerm: "plan:50", maxSearchResultCount: undefined, options: {} }],
        ["invoice in:", { searchTerm: "invoice in:", maxSearchResultCount: undefined, options: {} }],
        ["plugin:x in:rel", { searchTerm: "plugin:x in:rel", maxSearchResultCount: undefined, options: {} }],
        ["a ~b", { searchTerm: "a ~b", maxSearchResultCount: undefined, options: {} }],
        ["a kind:foo", { searchTerm: "a kind:foo", maxSearchResultCount: undefined, options: {} }],
        ["a changed:soon", { searchTerm: "a changed:soon", maxSearchResultCount: undefined, options: {} }],
        ["a size:big", { searchTerm: "a size:big", maxSearchResultCount: undefined, options: {} }],
        ["a sort:date", { searchTerm: "a sort:date", maxSearchResultCount: undefined, options: {} }],
        ["a type:link", { searchTerm: "a type:link", maxSearchResultCount: undefined, options: {} }],
        ["a :x", { searchTerm: "a :x", maxSearchResultCount: undefined, options: {} }],
    ])("should parse %j", (searchTerm, expected) => {
        expect(parseSearchTerm(searchTerm)).toEqual(expected);
    });
});

describe(hasFilter, () => {
    it("should be true for filters only", () => {
        expect(hasFilter({})).toBe(false);
        expect(hasFilter({ searchFolders: ["~"], sort: "time", type: "folder" })).toBe(false);
        expect(hasFilter({ changed: "today" })).toBe(true);
        expect(hasFilter({ size: "+1M" })).toBe(true);
        expect(hasFilter({ kind: "docs" })).toBe(true);
    });
});
