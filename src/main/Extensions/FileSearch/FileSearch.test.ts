import type { OperatingSystem } from "@common/Core";
import type { AssetPathResolver } from "@Core/AssetPathResolver";
import type { FileSystemUtility } from "@Core/FileSystemUtility";
import type { Logger } from "@Core/Logger";
import type { SettingsManager } from "@Core/SettingsManager";
import type { Translator } from "@Core/Translator";
import type { App } from "electron";
import { describe, expect, it, vi } from "vitest";

import { FileSearch } from "./FileSearch";
import type { FileSearcher } from "./FileSearcher";
import { EverythingFileSearcher } from "./Windows/EverythingFileSearcher";

describe(EverythingFileSearcher, () => {
    describe(EverythingFileSearcher.escapeSearchTerm, () => {
        it.each([
            ["test", "test"],
            ["ext:pdf test", "ext:pdf test"],
            ["size:>1MB", "size:^>1MB"],
            ["size:<1MB", "size:^<1MB"],
            ["ext:txt -s", "ext:txt -s"],
            [
                "-size -dm -sizecolor 0x0d -dmcolor 0x0b -save-settings",
                "-size -dm -sizecolor 0x0d -dmcolor 0x0b -save-settings",
            ],
            ["\\&|><^", "^\\^&^|^>^<^^"],
        ])("should escape arguments with a regex", (searchTerm, expectedPattern) => {
            const escapedSearchTerm = searchTerm.replace(/([\\&|><^])/g, "^$1");
            expect(escapedSearchTerm).toMatch(expectedPattern);
        });
    });
});

describe(FileSearch, () => {
    const createFileSearch = ({
        operatingSystem = "Linux",
        settings = {},
    }: {
        operatingSystem?: OperatingSystem;
        settings?: Record<string, unknown>;
    }) => {
        const getFilePathsBySearchTerm = vi.fn().mockResolvedValue(["/home/user/invoice.pdf"]);

        const fileSearch = new FileSearch(
            operatingSystem,
            <AssetPathResolver>{},
            { isAccessibleSync: () => true, isDirectory: () => false } as unknown as FileSystemUtility,
            <SettingsManager>{ getValue: (key: string, defaultValue: unknown) => settings[key] ?? defaultValue },
            {
                getFileIcon: () => Promise.resolve({ isEmpty: () => false, toDataURL: () => "data:image/png;base64," }),
            } as unknown as App,
            <Logger>{},
            <Translator>{},
            <FileSearcher>{ getFilePathsBySearchTerm: (s, m, f) => getFilePathsBySearchTerm(s, m, f) },
        );

        return { fileSearch, getFilePathsBySearchTerm };
    };

    describe("getAsyncSearchResultItems", () => {
        it("should search files exclusively when the search term starts with the prefix", async () => {
            const { fileSearch, getFilePathsBySearchTerm } = createFileSearch({});

            const { items, exclusive } = await fileSearch.getAsyncSearchResultItems("f invoice");

            expect(exclusive).toBe(true);
            expect(items.map((i) => i.name)).toEqual(["invoice.pdf"]);
            expect(getFilePathsBySearchTerm).toHaveBeenCalledWith("invoice", 20, {});
        });

        it("should use the max result count from the search term", async () => {
            const { fileSearch, getFilePathsBySearchTerm } = createFileSearch({});

            await fileSearch.getAsyncSearchResultItems("f invoice n:50");
            await fileSearch.getAsyncSearchResultItems("invoice n:3");

            expect(getFilePathsBySearchTerm).toHaveBeenNthCalledWith(1, "invoice", 50, {});
            expect(getFilePathsBySearchTerm).toHaveBeenNthCalledWith(2, "invoice", 3, {});
        });

        it("should pass the search folders from the search term", async () => {
            const { fileSearch, getFilePathsBySearchTerm } = createFileSearch({});

            await fileSearch.getAsyncSearchResultItems("f invoice ~");

            expect(getFilePathsBySearchTerm).toHaveBeenCalledWith("invoice", 20, { searchFolders: ["~"] });
        });

        it("should search with filters only when the prefix is used", async () => {
            const { fileSearch, getFilePathsBySearchTerm } = createFileSearch({});

            expect((await fileSearch.getAsyncSearchResultItems("f changed:today")).items.length).toBe(1);
            expect(getFilePathsBySearchTerm).toHaveBeenCalledWith("", 20, { changed: "today" });

            expect((await fileSearch.getAsyncSearchResultItems("f ~ n:5")).items).toEqual([]);
            expect(getFilePathsBySearchTerm).toHaveBeenCalledOnce();
        });

        it("should add a few files to the regular search results when there is no prefix", async () => {
            const { fileSearch, getFilePathsBySearchTerm } = createFileSearch({});

            const { items, exclusive } = await fileSearch.getAsyncSearchResultItems("invoice");

            expect(exclusive).toBe(false);
            expect(items.length).toBe(1);
            expect(getFilePathsBySearchTerm).toHaveBeenCalledWith("invoice", 8, {});
        });

        it("should not search when the search term is too short", async () => {
            const { fileSearch, getFilePathsBySearchTerm } = createFileSearch({});

            expect(await fileSearch.getAsyncSearchResultItems("in")).toEqual({ items: [], exclusive: false });
            expect(await fileSearch.getAsyncSearchResultItems("f")).toEqual({ items: [], exclusive: false });
            expect(getFilePathsBySearchTerm).not.toHaveBeenCalled();
        });

        it("should not search without prefix when files are not included in the main search", async () => {
            const { fileSearch, getFilePathsBySearchTerm } = createFileSearch({
                settings: { "extension[FileSearch].includeInMainSearch": false },
            });

            expect(await fileSearch.getAsyncSearchResultItems("invoice")).toEqual({ items: [], exclusive: false });
            expect(getFilePathsBySearchTerm).not.toHaveBeenCalled();

            expect((await fileSearch.getAsyncSearchResultItems("f invoice")).exclusive).toBe(true);
        });

        it("should not search on other operating systems", async () => {
            const { fileSearch, getFilePathsBySearchTerm } = createFileSearch({ operatingSystem: "Windows" });

            expect(await fileSearch.getAsyncSearchResultItems("f invoice")).toEqual({ items: [], exclusive: false });
            expect(getFilePathsBySearchTerm).not.toHaveBeenCalled();
        });
    });
});
