import { useExtensionSetting } from "@Core/Hooks";
import { Setting } from "@Core/Settings/Setting";
import { SettingGroup } from "@Core/Settings/SettingGroup";
import { SettingGroupList } from "@Core/Settings/SettingGroupList";
import { Button, Input, SpinButton, Switch, Textarea, Tooltip } from "@fluentui/react-components";
import { FolderRegular } from "@fluentui/react-icons";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const FileSearchSettings = () => {
    const { t } = useTranslation("extension[FileSearch]");

    const { value: maxSearchResultCount, updateValue: setMaxSearchResultCount } = useExtensionSetting<number>({
        extensionId: "FileSearch",
        key: "maxSearchResultCount",
    });

    const { value: esFilePath, updateValue: setEsFilePath } = useExtensionSetting<string>({
        extensionId: "FileSearch",
        key: "everythingCliFilePath",
    });

    const isLinux = window.ContextBridge.getOperatingSystem() === "Linux";

    const { value: ffsFilePath, updateValue: setFfsFilePath } = useExtensionSetting<string>({
        extensionId: "FileSearch",
        key: "ffsFilePath",
    });

    const { value: ffsSearchFolders, updateValue: setFfsSearchFolders } = useExtensionSetting<string[]>({
        extensionId: "FileSearch",
        key: "ffsSearchFolders",
    });

    const { value: ffsExcludedFolders, updateValue: setFfsExcludedFolders } = useExtensionSetting<string[]>({
        extensionId: "FileSearch",
        key: "ffsExcludedFolders",
    });

    const { value: prefix, updateValue: setPrefix } = useExtensionSetting<string>({
        extensionId: "FileSearch",
        key: "prefix",
    });

    const { value: includeInMainSearch, updateValue: setIncludeInMainSearch } = useExtensionSetting<boolean>({
        extensionId: "FileSearch",
        key: "includeInMainSearch",
    });

    const { value: mainSearchMaxResultCount, updateValue: setMainSearchMaxResultCount } = useExtensionSetting<number>({
        extensionId: "FileSearch",
        key: "mainSearchMaxResultCount",
    });

    const { value: mainSearchMinTermLength, updateValue: setMainSearchMinTermLength } = useExtensionSetting<number>({
        extensionId: "FileSearch",
        key: "mainSearchMinTermLength",
    });

    // The folder lists are edited as text with one folder per line. The text is kept locally, so that typing a line
    // break is not swallowed by the conversion to a list without empty lines.
    const [searchFoldersText, setSearchFoldersText] = useState(ffsSearchFolders.join("\n"));
    const [excludedFoldersText, setExcludedFoldersText] = useState(ffsExcludedFolders.join("\n"));

    const toFolders = (text: string) =>
        text
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

    const chooseFfsFile = async () => {
        const result = await window.ContextBridge.showOpenDialog({ properties: ["openFile"] });

        if (!result.canceled && result.filePaths.length > 0) {
            setFfsFilePath(result.filePaths[0]);
        }
    };

    const chooseFile = async () => {
        const result = await window.ContextBridge.showOpenDialog({ properties: ["openFile"] });

        if (!result.canceled && result.filePaths.length > 0) {
            setEsFilePath(result.filePaths[0]);
        }
    };

    return (
        <SettingGroupList>
            <SettingGroup title={t("extensionName")}>
                <Setting
                    label={t("maxSearchResults")}
                    control={
                        <SpinButton
                            value={maxSearchResultCount}
                            min={1}
                            onChange={(_, { value }) => value && setMaxSearchResultCount(value)}
                        />
                    }
                />
                {window.ContextBridge.getOperatingSystem() === "Windows" && (
                    <Setting
                        label={t("esFilePath")}
                        description={window.ContextBridge.fileExists(esFilePath) ? undefined : t("fileDoesNotExist")}
                        control={
                            <div style={{ display: "flex", flexDirection: "column", width: "80%" }}>
                                <Input
                                    value={esFilePath}
                                    onChange={(_, { value }) => setEsFilePath(value)}
                                    contentAfter={
                                        <Tooltip relationship="label" content="Choose file" withArrow>
                                            <Button
                                                size="small"
                                                appearance="subtle"
                                                icon={<FolderRegular fontSize={14} />}
                                                onClick={() => chooseFile()}
                                            />
                                        </Tooltip>
                                    }
                                />
                            </div>
                        }
                    />
                )}
                {isLinux && (
                    <>
                        <Setting
                            label={t("ffsFilePath")}
                            description={
                                ffsFilePath && !window.ContextBridge.fileExists(ffsFilePath)
                                    ? t("fileDoesNotExist")
                                    : t("ffsFilePathDescription")
                            }
                            control={
                                <div style={{ display: "flex", flexDirection: "column", width: "80%" }}>
                                    <Input
                                        value={ffsFilePath}
                                        onChange={(_, { value }) => setFfsFilePath(value)}
                                        contentAfter={
                                            <Tooltip relationship="label" content="Choose file" withArrow>
                                                <Button
                                                    size="small"
                                                    appearance="subtle"
                                                    icon={<FolderRegular fontSize={14} />}
                                                    onClick={() => chooseFfsFile()}
                                                />
                                            </Tooltip>
                                        }
                                    />
                                </div>
                            }
                        />
                        <Setting
                            label={t("ffsSearchFolders")}
                            description={t("ffsSearchFoldersDescription")}
                            control={
                                <Textarea
                                    style={{ width: "80%" }}
                                    rows={3}
                                    value={searchFoldersText}
                                    onChange={(_, { value }) => {
                                        setSearchFoldersText(value);
                                        setFfsSearchFolders(toFolders(value));
                                    }}
                                />
                            }
                        />
                        <Setting
                            label={t("ffsExcludedFolders")}
                            description={t("ffsExcludedFoldersDescription")}
                            control={
                                <Textarea
                                    style={{ width: "80%" }}
                                    rows={3}
                                    value={excludedFoldersText}
                                    onChange={(_, { value }) => {
                                        setExcludedFoldersText(value);
                                        setFfsExcludedFolders(toFolders(value));
                                    }}
                                />
                            }
                        />
                        <Setting
                            label={t("prefix")}
                            description={t("prefixDescription")}
                            control={<Input value={prefix} onChange={(_, { value }) => setPrefix(value)} />}
                        />
                        <Setting
                            label={t("includeInMainSearch")}
                            control={
                                <Switch
                                    checked={includeInMainSearch}
                                    onChange={(_, { checked }) => setIncludeInMainSearch(checked)}
                                />
                            }
                        />
                        <Setting
                            label={t("mainSearchMaxResults")}
                            control={
                                <SpinButton
                                    value={mainSearchMaxResultCount}
                                    min={1}
                                    onChange={(_, { value }) => value && setMainSearchMaxResultCount(value)}
                                />
                            }
                        />
                        <Setting
                            label={t("mainSearchMinTermLength")}
                            control={
                                <SpinButton
                                    value={mainSearchMinTermLength}
                                    min={1}
                                    onChange={(_, { value }) => value && setMainSearchMinTermLength(value)}
                                />
                            }
                        />
                    </>
                )}
            </SettingGroup>
        </SettingGroupList>
    );
};
