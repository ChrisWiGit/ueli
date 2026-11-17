import { dirname } from "path";

import type { FileSystemUtility } from "@Core/FileSystemUtility";

export type StartMenuEntryOptions = {
    /**
     * The `.desktop` file of the entry, e.g. `~/.local/share/applications/ueli.desktop`.
     */
    desktopFilePath: string;

    /**
     * The program to start and its arguments.
     */
    command: string[];

    iconFilePath: string;
};

/**
 * Creates and removes the entry in the application menu ("start menu") on Linux, which is a `.desktop` file.
 */
export class StartMenuEntryManager {
    public static readonly DefaultName = "Ueli";

    /**
     * Marks the file as created by Ueli, so that a file of the user or of a package is never changed or removed.
     */
    private static readonly Marker = "X-Ueli-StartMenuEntry=true";

    public constructor(
        private readonly fileSystemUtility: FileSystemUtility,
        private readonly options: StartMenuEntryOptions,
    ) {}

    public exists(): boolean {
        return this.fileSystemUtility.existsSync(this.options.desktopFilePath) && this.isOwnFile();
    }

    public async create(name: string): Promise<void> {
        this.ensureFileIsNotForeign();

        await this.fileSystemUtility.createFolderIfDoesntExist(dirname(this.options.desktopFilePath));
        await this.fileSystemUtility.writeTextFile(this.getDesktopFileContent(name), this.options.desktopFilePath);
    }

    public async remove(): Promise<void> {
        if (!this.fileSystemUtility.existsSync(this.options.desktopFilePath)) {
            return;
        }

        this.ensureFileIsNotForeign();

        await this.fileSystemUtility.removeFile(this.options.desktopFilePath);
    }

    public getDesktopFileContent(name: string): string {
        const lines = [
            "[Desktop Entry]",
            "Type=Application",
            `Name=${StartMenuEntryManager.escapeValue(name.trim() || StartMenuEntryManager.DefaultName)}`,
            "Comment=Keystroke launcher",
            `Exec=${this.options.command.map((part) => StartMenuEntryManager.quoteExecArgument(part)).join(" ")}`,
            `Icon=${StartMenuEntryManager.escapeValue(this.options.iconFilePath)}`,
            "Terminal=false",
            "Categories=Utility;",
            "StartupNotify=false",
            StartMenuEntryManager.Marker,
        ];

        return `${lines.join("\n")}\n`;
    }

    /**
     * Escapes a string value of a desktop file: backslash and line breaks.
     */
    public static escapeValue(value: string): string {
        return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
    }

    /**
     * Quotes an argument of the `Exec` key as described in the Desktop Entry Specification: the argument is put in
     * double quotes, the characters `"`, `` ` ``, `$` and `\` are escaped with a backslash, `%` is doubled. On top of
     * that the general escaping of string values applies, which doubles each backslash again.
     */
    public static quoteExecArgument(argument: string): string {
        const quoted = `"${argument.replace(/(["`$\\])/g, "\\$1")}"`;

        return StartMenuEntryManager.escapeValue(quoted).replace(/%/g, "%%");
    }

    private isOwnFile(): boolean {
        try {
            return this.fileSystemUtility
                .readTextFileSync(this.options.desktopFilePath)
                .split("\n")
                .some((line) => line.trim() === StartMenuEntryManager.Marker);
        } catch {
            return false;
        }
    }

    private ensureFileIsNotForeign(): void {
        if (this.fileSystemUtility.existsSync(this.options.desktopFilePath) && !this.isOwnFile()) {
            throw new Error(`"${this.options.desktopFilePath}" exists and was not created by Ueli`);
        }
    }
}
