import { useExtensionSetting } from "@Core/Hooks";
import { Button, Popover, PopoverSurface, PopoverTrigger, Text, tokens } from "@fluentui/react-components";
import { QuestionCircle16Regular } from "@fluentui/react-icons";
import { useTranslation } from "react-i18next";

/**
 * A button with a question mark that shows examples of what can be typed to search files.
 * @param showPrefix Whether to show how to search files only with the prefix. Only useful in the main search window.
 * @param onClose Called when the help is closed, e.g. to give the focus back to the search input.
 */
export const FileSearchHelp = ({ showPrefix, onClose }: { showPrefix?: boolean; onClose?: () => void }) => {
    const { t } = useTranslation("extension[FileSearch]");

    const { value: prefix } = useExtensionSetting<string>({ extensionId: "FileSearch", key: "prefix" });

    const rows: { examples: string[]; description: string }[] = [
        ...(showPrefix && prefix.trim().length > 0
            ? [{ examples: [`${prefix.trim()} invoice`], description: t("helpPrefix") }]
            : []),
        { examples: ["inv 2024"], description: t("helpAllParts") },
        { examples: ["*.pdf", "ext:pdf;odt"], description: t("helpWildcards") },
        { examples: ["!tmp"], description: t("helpExclude") },
        { examples: ["projects/ inv"], description: t("helpPath") },
        { examples: ["~", "~/projects", "in:/etc"], description: t("helpFolder") },
        { examples: ["in:/"], description: t("helpEverywhere") },
        { examples: ["n:50"], description: t("helpMaxResults") },
        { examples: ["changed:today", "changed:7d", "changed:2h"], description: t("helpChanged") },
        { examples: ["size:+10M", "size:-100K", "size:1M..1G"], description: t("helpSize") },
        { examples: ["kind:docs"], description: t("helpKind") },
        { examples: ["type:folder", "type:file"], description: t("helpType") },
        { examples: ["sort:-time", "sort:-size"], description: t("helpSort") },
    ];

    return (
        <Popover withArrow positioning="above-start" size="small" onOpenChange={(_, { open }) => !open && onClose?.()}>
            <PopoverTrigger disableButtonEnhancement>
                <Button
                    className="non-draggable-area"
                    size="small"
                    appearance="subtle"
                    aria-label={t("helpTitle")}
                    icon={<QuestionCircle16Regular />}
                />
            </PopoverTrigger>
            <PopoverSurface
                className="non-draggable-area"
                style={{
                    maxHeight: "calc(100vh - 64px)",
                    maxWidth: "calc(100vw - 48px)",
                    overflowY: "auto",
                    padding: 10,
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <Text weight="semibold" size={200}>
                        {t("helpTitle")}
                    </Text>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "auto minmax(0, 1fr)",
                            columnGap: 12,
                            rowGap: 3,
                            alignItems: "center",
                        }}
                    >
                        {rows.map(({ examples, description }) => (
                            <div key={examples.join(" ")} style={{ display: "contents" }}>
                                <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                                    {examples.map((example) => (
                                        <code
                                            key={example}
                                            style={{
                                                fontFamily: tokens.fontFamilyMonospace,
                                                fontSize: tokens.fontSizeBase200,
                                                lineHeight: tokens.lineHeightBase200,
                                                whiteSpace: "nowrap",
                                                padding: "0 5px",
                                                borderRadius: tokens.borderRadiusMedium,
                                                border: `1px solid ${tokens.colorNeutralStroke2}`,
                                                backgroundColor: tokens.colorNeutralBackground3,
                                            }}
                                        >
                                            {example}
                                        </code>
                                    ))}
                                </div>
                                <Text size={200}>{description}</Text>
                            </div>
                        ))}
                    </div>
                </div>
            </PopoverSurface>
        </Popover>
    );
};
