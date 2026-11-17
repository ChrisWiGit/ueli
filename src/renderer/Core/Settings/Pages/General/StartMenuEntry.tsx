import { useSetting } from "@Core/Hooks";
import { Setting } from "@Core/Settings/Setting";
import { Input, Switch } from "@fluentui/react-components";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const defaultName = "Ueli";

/**
 * Linux only: creates or removes the entry in the application menu and sets the name it is found by.
 */
export const StartMenuEntry = () => {
    const { t } = useTranslation("settingsGeneral");

    const [exists, setExists] = useState<boolean>(window.ContextBridge.startMenuEntryExists());
    const [failed, setFailed] = useState<boolean>(false);

    const { value: name, updateValue: setName } = useSetting<string>({
        key: "general.startMenuEntryName",
        defaultValue: defaultName,
    });

    const apply = async (enabled: boolean, name: string) => {
        const succeeded = await window.ContextBridge.setStartMenuEntry(enabled, name);

        setFailed(!succeeded);
        setExists(window.ContextBridge.startMenuEntryExists());
    };

    const updateName = async (name: string) => {
        setName(name);

        if (exists) {
            await apply(true, name);
        }
    };

    return (
        <>
            <Setting
                label={t("startMenuEntry")}
                description={failed ? t("startMenuEntryFailed") : t("startMenuEntryDescription")}
                control={<Switch size="small" checked={exists} onChange={(_, { checked }) => apply(checked, name)} />}
            />
            <Setting
                label={t("startMenuEntryName")}
                description={t("startMenuEntryNameDescription")}
                control={
                    <Input value={name} placeholder={defaultName} onChange={(_, { value }) => updateName(value)} />
                }
            />
        </>
    );
};
