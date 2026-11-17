import type { FileSystemUtility } from "@Core/FileSystemUtility";
import { describe, expect, it, vi } from "vitest";

import { StartMenuEntryManager } from "./StartMenuEntryManager";

const desktopFilePath = "/home/user/.local/share/applications/ueli.desktop";

const createManager = (files: Record<string, string> = {}, command = ["/opt/ueli/ueli"]) => {
    const createFolderIfDoesntExist = vi.fn().mockResolvedValue(undefined);

    const fileSystemUtility = <FileSystemUtility>(<unknown>{
        existsSync: (filePath: string) => filePath in files,
        readTextFileSync: (filePath: string) => files[filePath],
        createFolderIfDoesntExist: (folderPath: string) => createFolderIfDoesntExist(folderPath),
        writeTextFile: async (data: string, filePath: string) => {
            files[filePath] = data;
        },
        removeFile: async (filePath: string) => {
            delete files[filePath];
        },
    });

    const manager = new StartMenuEntryManager(fileSystemUtility, {
        desktopFilePath,
        command,
        iconFilePath: "/opt/ueli/icon.png",
    });

    return { manager, files, createFolderIfDoesntExist };
};

describe(StartMenuEntryManager, () => {
    it("should create the desktop file with the given name", async () => {
        const { manager, files, createFolderIfDoesntExist } = createManager();

        expect(manager.exists()).toBe(false);

        await manager.create(" Launcher ");

        expect(createFolderIfDoesntExist).toHaveBeenCalledWith("/home/user/.local/share/applications");
        expect(manager.exists()).toBe(true);

        expect(files[desktopFilePath]).toBe(
            [
                "[Desktop Entry]",
                "Type=Application",
                "Name=Launcher",
                "Comment=Keystroke launcher",
                'Exec="/opt/ueli/ueli"',
                "Icon=/opt/ueli/icon.png",
                "Terminal=false",
                "Categories=Utility;",
                "StartupNotify=false",
                "X-Ueli-StartMenuEntry=true",
                "",
            ].join("\n"),
        );
    });

    it("should use the default name when the name is empty", () => {
        expect(createManager().manager.getDesktopFileContent("  ")).toContain("\nName=Ueli\n");
    });

    it("should replace its own file when the name changes", async () => {
        const { manager, files } = createManager();

        await manager.create("One");
        await manager.create("Two");

        expect(files[desktopFilePath]).toContain("\nName=Two\n");
    });

    it("should remove its own file", async () => {
        const { manager, files } = createManager();

        await manager.create("Ueli");
        await manager.remove();

        expect(files).toEqual({});
        expect(manager.exists()).toBe(false);

        await expect(manager.remove()).resolves.toBeUndefined();
    });

    it("should neither replace nor remove a file that was not created by Ueli", async () => {
        const foreign = "[Desktop Entry]\nName=Ueli\nExec=ueli\n";
        const { manager, files } = createManager({ [desktopFilePath]: foreign });

        expect(manager.exists()).toBe(false);
        await expect(manager.create("Ueli")).rejects.toThrow();
        await expect(manager.remove()).rejects.toThrow();
        expect(files[desktopFilePath]).toBe(foreign);
    });

    it("should quote the arguments of the command", () => {
        const { manager } = createManager({}, ["/opt/my apps/electron", '/home/user/a "b" $c `d` 100% \\e']);

        expect(manager.getDesktopFileContent("Ueli")).toContain(
            '\nExec="/opt/my apps/electron" "/home/user/a \\\\"b\\\\" \\\\$c \\\\`d\\\\` 100%% \\\\\\\\e"\n',
        );
    });

    it("should escape line breaks and backslashes in the name", () => {
        expect(createManager().manager.getDesktopFileContent("a\nb\\c")).toContain("\nName=a\\nb\\\\c\n");
    });
});
