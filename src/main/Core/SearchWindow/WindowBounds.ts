import type { BrowserWindow, Rectangle } from "electron";

/**
 * Checks bounds that were saved earlier. Returns them if they are valid and still visible on one of the displays
 * (a monitor may have been removed or the resolution may have changed), otherwise `undefined`.
 */
export const getRestorableBounds = (
    savedBounds: unknown,
    displays: { workArea: Rectangle }[],
    minSize = { width: 200, height: 100 },
): Rectangle | undefined => {
    if (typeof savedBounds !== "object" || savedBounds === null) {
        return undefined;
    }

    const { x, y, width, height } = <Record<string, unknown>>savedBounds;

    if (![x, y, width, height].every((value) => typeof value === "number" && Number.isFinite(value))) {
        return undefined;
    }

    const bounds = <Rectangle>{ x, y, width, height };

    if (bounds.width < minSize.width || bounds.height < minSize.height) {
        return undefined;
    }

    // A reasonable part of the window must be inside a display, so that the user can see and move it.
    const isVisibleOn = ({ workArea }: { workArea: Rectangle }) => {
        const visibleWidth =
            Math.min(bounds.x + bounds.width, workArea.x + workArea.width) - Math.max(bounds.x, workArea.x);

        const visibleHeight =
            Math.min(bounds.y + bounds.height, workArea.y + workArea.height) - Math.max(bounds.y, workArea.y);

        return visibleWidth >= 100 && visibleHeight >= 50;
    };

    return displays.some(isVisibleOn) ? bounds : undefined;
};

/**
 * Saves the bounds of the window a moment after it has been moved or resized, and when it is closed.
 */
export const saveBoundsOnChange = (
    browserWindow: BrowserWindow,
    saveBounds: (bounds: Rectangle) => void,
    delayInMs = 500,
) => {
    let timeout: ReturnType<typeof setTimeout> | undefined = undefined;

    const save = () => {
        clearTimeout(timeout);
        timeout = undefined;

        if (!browserWindow.isDestroyed() && !browserWindow.isMinimized() && !browserWindow.isFullScreen()) {
            saveBounds(browserWindow.getBounds());
        }
    };

    const saveLater = () => {
        clearTimeout(timeout);
        timeout = setTimeout(save, delayInMs);
    };

    browserWindow.on("move", saveLater);
    browserWindow.on("resize", saveLater);

    // Only if a change is still waiting to be saved
    browserWindow.on("close", () => timeout !== undefined && save());
};
