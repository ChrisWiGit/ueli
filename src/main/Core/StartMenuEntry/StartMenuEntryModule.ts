import { homedir } from "os";
import { join } from "path";

import type { UeliModuleRegistry } from "@Core/ModuleRegistry";

import { StartMenuEntryManager } from "./StartMenuEntryManager";

export class StartMenuEntryModule {
    /**
     * In development the Electron binary from node_modules is started with the path of the app. Its sandbox helper
     * (chrome-sandbox) is not owned by root, and distributions like Ubuntu don't allow unprivileged user namespaces
     * for it, so Electron would abort at startup. Therefore the sandbox is switched off for this case. A packaged
     * app sets up the sandbox helper during installation and keeps the sandbox.
     */
    private static getDevelopmentCommand(appPath: string): string[] {
        return [process.execPath, "--no-sandbox", appPath];
    }

    public static bootstrap(moduleRegistry: UeliModuleRegistry) {
        const app = moduleRegistry.get("App");
        const appIconFilePathResolver = moduleRegistry.get("AppIconFilePathResolver");
        const environmentVariableProvider = moduleRegistry.get("EnvironmentVariableProvider");
        const fileSystemUtility = moduleRegistry.get("FileSystemUtility");
        const ipcMain = moduleRegistry.get("IpcMain");
        const logger = moduleRegistry.get("Logger");
        const operatingSystem = moduleRegistry.get("OperatingSystem");

        const isSupported = operatingSystem === "Linux";

        const dataHome = environmentVariableProvider.get("XDG_DATA_HOME") || join(homedir(), ".local", "share");

        // An AppImage is mounted at a different path on each start, so the AppImage file itself must be started.
        // In development the Electron binary needs the path of the app as argument.
        const executableFilePath = environmentVariableProvider.get("APPIMAGE") || process.execPath;

        const startMenuEntryManager = new StartMenuEntryManager(fileSystemUtility, {
            desktopFilePath: join(dataHome, "applications", "ueli.desktop"),
            command: app.isPackaged
                ? [executableFilePath]
                : StartMenuEntryModule.getDevelopmentCommand(app.getAppPath()),
            iconFilePath: appIconFilePathResolver.resolve(),
        });

        ipcMain.on("startMenuEntryExists", (event) => {
            event.returnValue = isSupported && startMenuEntryManager.exists();
        });

        ipcMain.handle(
            "setStartMenuEntry",
            async (_, { enabled, name }: { enabled: boolean; name: string }): Promise<boolean> => {
                if (!isSupported) {
                    return false;
                }

                try {
                    if (enabled) {
                        await startMenuEntryManager.create(name);
                    } else {
                        await startMenuEntryManager.remove();
                    }

                    return true;
                } catch (error) {
                    logger.error(`Unable to ${enabled ? "create" : "remove"} the start menu entry. Reason: ${error}`);
                    return false;
                }
            },
        );
    }
}
