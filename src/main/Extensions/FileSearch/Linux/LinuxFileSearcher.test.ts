import type { FileSystemUtility } from "@Core/FileSystemUtility";
import type { Logger } from "@Core/Logger";
import type { SettingsManager } from "@Core/SettingsManager";
import { describe, expect, it, vi } from "vitest";

import type { ExecuteFile } from "./executeFile";
import { LinuxFileSearcher } from "./LinuxFileSearcher";

const createSearcher = ({
    settings = {},
    executeFile = vi.fn(),
    localFfsExists = true,
}: {
    settings?: Record<string, unknown>;
    executeFile?: ExecuteFile;
    localFfsExists?: boolean;
}) => {
    const logError = vi.fn();

    const searcher = new LinuxFileSearcher(
        <SettingsManager>{
            getValue: (key: string, defaultValue: unknown) => settings[key] ?? defaultValue,
        },
        { isAccessibleSync: () => localFfsExists } as unknown as FileSystemUtility,
        <Logger>{ error: (message: string) => logError(message) },
        executeFile,
        "/home/user",
    );

    return { searcher, logError };
};

describe(LinuxFileSearcher, () => {
    it("should pass the search term as one argument after the options", async () => {
        const executeFile = vi.fn().mockResolvedValue({ stdout: "", exitCode: 1 });
        const { searcher } = createSearcher({ executeFile });

        await searcher.getFilePathsBySearchTerm(" -my file *.pdf ", 20);

        expect(executeFile).toHaveBeenCalledWith("/home/user/.local/bin/ffs", [
            "--json",
            "-q",
            "-n",
            "20",
            "-d",
            "--",
            "-my file *.pdf",
        ]);
    });

    it("should pass search folders and excluded folders", () => {
        const { searcher } = createSearcher({
            settings: {
                "extension[FileSearch].ffsSearchFolders": ["/home/user/projects", " ", "/etc"],
                "extension[FileSearch].ffsExcludedFolders": ["/home/user/projects/old"],
            },
        });

        expect(searcher.getArguments("test", 5)).toEqual([
            "--json",
            "-q",
            "-n",
            "5",
            "-d",
            "--in",
            "/home/user/projects",
            "--in",
            "/etc",
            "--exclude",
            "/home/user/projects/old",
            "--",
            "test",
        ]);
    });

    it("should replace ~ by the home folder and prefer the search folders of the search", () => {
        const { searcher } = createSearcher({
            settings: { "extension[FileSearch].ffsSearchFolders": ["~", "~/projects", "~other"] },
        });

        expect(searcher.getArguments("test", 5)).toEqual([
            ...["--json", "-q", "-n", "5", "-d"],
            ...["--in", "/home/user", "--in", "/home/user/projects", "--in", "~other"],
            ...["--", "test"],
        ]);

        expect(searcher.getArguments("test", 5, { searchFolders: ["~/docs"] })).toEqual([
            ...["--json", "-q", "-n", "5", "-d"],
            ...["--in", "/home/user/docs"],
            ...["--", "test"],
        ]);
    });

    it("should search the whole index when the search folder is /", () => {
        const { searcher } = createSearcher({
            settings: { "extension[FileSearch].ffsSearchFolders": ["~"] },
        });

        expect(searcher.getArguments("test", 5, { searchFolders: ["/"] })).toEqual([
            ...["--json", "-q", "-n", "5", "-d", "--", "test"],
        ]);
    });

    it("should pass the filters and allow a search without a search term", async () => {
        const executeFile = vi.fn().mockResolvedValue({ stdout: "", exitCode: 1 });
        const { searcher } = createSearcher({ executeFile });

        await searcher.getFilePathsBySearchTerm("", 10, {
            changed: "today",
            size: "+1M",
            kind: "docs",
            type: "file",
            sort: "time",
            reverse: true,
        });

        expect(executeFile).toHaveBeenCalledWith("/home/user/.local/bin/ffs", [
            ...["--json", "-q", "-n", "10"],
            ...["--changed", "today", "--size", "+1M", "--kind", "docs", "-s", "time", "-r"],
            "--",
        ]);
    });

    it("should search folders only", () => {
        expect(createSearcher({}).searcher.getArguments("a", 5, { type: "folder" })).toEqual([
            ...["--json", "-q", "-n", "5", "-D", "--", "a"],
        ]);
    });

    it("should not start ffs without a search term and with options that are no filter", async () => {
        const executeFile = vi.fn();
        const { searcher } = createSearcher({ executeFile });

        expect(await searcher.getFilePathsBySearchTerm("", 20, { searchFolders: ["~"], sort: "time" })).toEqual([]);
        expect(executeFile).not.toHaveBeenCalled();
    });

    it("should return the paths of the JSON lines and skip invalid lines", async () => {
        const stdout = [
            JSON.stringify({ path: "/home/user/a.txt", name: "a.txt", dir: "/home/user", size: 1, mtime: 1 }),
            "not json",
            JSON.stringify({ path_b64: "L2hvbWUv", name: "x" }),
            "",
            JSON.stringify({ path: '/home/user/with "quote"\nand newline', name: "x" }),
        ].join("\n");

        const { searcher } = createSearcher({ executeFile: vi.fn().mockResolvedValue({ stdout, exitCode: 0 }) });

        expect(await searcher.getFilePathsBySearchTerm("a", 20)).toEqual([
            "/home/user/a.txt",
            '/home/user/with "quote"\nand newline',
        ]);
    });

    it("should return an empty list without an error when ffs finds nothing (exit code 1)", async () => {
        const { searcher, logError } = createSearcher({
            executeFile: vi.fn().mockResolvedValue({ stdout: "", exitCode: 1 }),
        });

        expect(await searcher.getFilePathsBySearchTerm("a", 20)).toEqual([]);
        expect(logError).not.toHaveBeenCalled();
    });

    it("should return an empty list and log an error when ffs fails (exit code 2)", async () => {
        const { searcher, logError } = createSearcher({
            executeFile: vi.fn().mockResolvedValue({ stdout: "", exitCode: 2 }),
        });

        expect(await searcher.getFilePathsBySearchTerm("a", 20)).toEqual([]);
        expect(logError).toHaveBeenCalledOnce();
    });

    it("should return an empty list and log an error when ffs can't be started", async () => {
        const { searcher, logError } = createSearcher({
            executeFile: vi.fn().mockRejectedValue(new Error("ENOENT")),
        });

        expect(await searcher.getFilePathsBySearchTerm("a", 20)).toEqual([]);
        expect(logError).toHaveBeenCalledOnce();
    });

    it("should not start ffs when the search term is empty", async () => {
        const executeFile = vi.fn();
        const { searcher } = createSearcher({ executeFile });

        expect(await searcher.getFilePathsBySearchTerm("   ", 20)).toEqual([]);
        expect(executeFile).not.toHaveBeenCalled();
    });

    describe("getFfsFilePath", () => {
        it("should prefer the configured file path", () => {
            const { searcher } = createSearcher({ settings: { "extension[FileSearch].ffsFilePath": "/opt/ffs" } });
            expect(searcher.getFfsFilePath()).toBe("/opt/ffs");
        });

        it("should use ~/.local/bin/ffs if it exists", () => {
            expect(createSearcher({}).searcher.getFfsFilePath()).toBe("/home/user/.local/bin/ffs");
        });

        it("should fall back to ffs from the PATH", () => {
            expect(createSearcher({ localFfsExists: false }).searcher.getFfsFilePath()).toBe("ffs");
        });
    });
});
