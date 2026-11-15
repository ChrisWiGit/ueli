import type { BrowserWindow, Rectangle } from "electron";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getRestorableBounds, saveBoundsOnChange } from "./WindowBounds";

describe(getRestorableBounds, () => {
    const displays = [
        { workArea: { x: 0, y: 0, width: 1920, height: 1080 } },
        { workArea: { x: 1920, y: 0, width: 1280, height: 1024 } },
    ];

    it("should return bounds that are visible on a display", () => {
        expect(getRestorableBounds({ x: 100, y: 50, width: 600, height: 400 }, displays)).toEqual({
            x: 100,
            y: 50,
            width: 600,
            height: 400,
        });

        expect(getRestorableBounds({ x: 2500, y: 300, width: 600, height: 400 }, displays)).toBeDefined();
        expect(getRestorableBounds({ x: -400, y: 50, width: 600, height: 400 }, displays)).toBeDefined();
    });

    it("should ignore bounds that are not visible on any display", () => {
        expect(getRestorableBounds({ x: 5000, y: 50, width: 600, height: 400 }, displays)).toBeUndefined();
        expect(getRestorableBounds({ x: 100, y: 1060, width: 600, height: 400 }, displays)).toBeUndefined();
        expect(getRestorableBounds({ x: -550, y: 50, width: 600, height: 400 }, displays)).toBeUndefined();
        expect(getRestorableBounds({ x: 100, y: 50, width: 600, height: 400 }, [])).toBeUndefined();
    });

    it("should ignore invalid values", () => {
        expect(getRestorableBounds(undefined, displays)).toBeUndefined();
        expect(getRestorableBounds(null, displays)).toBeUndefined();
        expect(getRestorableBounds("100,50,600,400", displays)).toBeUndefined();
        expect(getRestorableBounds({ x: 100, y: 50, width: 600 }, displays)).toBeUndefined();
        expect(getRestorableBounds({ x: "100", y: 50, width: 600, height: 400 }, displays)).toBeUndefined();
        expect(getRestorableBounds({ x: NaN, y: 50, width: 600, height: 400 }, displays)).toBeUndefined();
        expect(getRestorableBounds({ x: 100, y: 50, width: 20, height: 10 }, displays)).toBeUndefined();
    });
});

describe(saveBoundsOnChange, () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    const createWindow = (bounds: Rectangle) => {
        const listeners: Record<string, () => void> = {};

        const browserWindow = <BrowserWindow>(<unknown>{
            on: (event: string, listener: () => void) => (listeners[event] = listener),
            isDestroyed: () => false,
            isMinimized: () => false,
            isFullScreen: () => false,
            getBounds: () => bounds,
        });

        return { browserWindow, emit: (event: string) => listeners[event]() };
    };

    it("should save the bounds once after the window was moved or resized", () => {
        const bounds = { x: 1, y: 2, width: 3, height: 4 };
        const { browserWindow, emit } = createWindow(bounds);
        const saveBounds = vi.fn();

        saveBoundsOnChange(browserWindow, saveBounds, 500);

        emit("move");
        emit("move");
        emit("resize");
        expect(saveBounds).not.toHaveBeenCalled();

        vi.advanceTimersByTime(500);
        expect(saveBounds).toHaveBeenCalledExactlyOnceWith(bounds);
    });

    it("should save a waiting change when the window is closed", () => {
        const { browserWindow, emit } = createWindow({ x: 1, y: 2, width: 3, height: 4 });
        const saveBounds = vi.fn();

        saveBoundsOnChange(browserWindow, saveBounds, 500);

        emit("close");
        expect(saveBounds).not.toHaveBeenCalled();

        emit("move");
        emit("close");
        expect(saveBounds).toHaveBeenCalledOnce();

        vi.advanceTimersByTime(1000);
        expect(saveBounds).toHaveBeenCalledOnce();
    });
});
