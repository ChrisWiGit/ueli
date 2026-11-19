import { join } from "path";

import { getExtensionSettingKey } from "@common/Core/Extension";
import type { EnvironmentVariableProvider } from "@Core/EnvironmentVariableProvider";
import type { SettingsManager } from "@Core/SettingsManager";
import type { App } from "electron";

export class Settings {
    public constructor(
        private readonly extensionId: string,
        private readonly settingsManager: SettingsManager,
        private readonly app: App,
        private readonly environmentVariableProvider: EnvironmentVariableProvider,
    ) {}

    public getValue<T>(key: string): T {
        return this.settingsManager.getValue(
            getExtensionSettingKey(this.extensionId, key),
            <T>this.getDefaultValue(key),
        );
    }

    public getDefaultValue(key: string) {
        const defaultValues: Record<string, unknown> = {
            macOsFolders: [
                "/System/Applications",
                "/System/Library/CoreServices",
                "/Applications",
                join(this.app.getPath("home"), "Applications"),
            ],
            mdfindFilterOption: "kMDItemKind=='Application'",
            includeWindowsStoreApps: true,
            windowsFileExtensions: ["lnk"],
            windowsFolders: [
                "C:\\ProgramData\\Microsoft\\Windows\\Start Menu",
                join(this.app.getPath("home"), "AppData", "Roaming", "Microsoft", "Windows", "Start Menu"),
            ],
            linuxFolders: this.getDefaultLinuxFolders(),
        };

        return defaultValues[key];
    }

    /**
     * Returns the "applications" folders of $XDG_DATA_HOME and $XDG_DATA_DIRS in order of precedence, see
     * https://specifications.freedesktop.org/desktop-entry-spec/latest/file-naming.html
     */
    private getDefaultLinuxFolders(): string[] {
        const dataHome =
            this.environmentVariableProvider.get("XDG_DATA_HOME") || join(this.app.getPath("home"), ".local", "share");

        const dataDirs = (
            this.environmentVariableProvider.get("XDG_DATA_DIRS") ||
            `${join("/", "usr", "local", "share")}:${join("/", "usr", "share")}`
        ).split(":");

        const folders = [dataHome, ...dataDirs].filter((dir) => dir.length > 0).map((dir) => join(dir, "applications"));

        return [...new Set(folders)];
    }
}
