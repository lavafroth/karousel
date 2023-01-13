function catchWrap(f) {
    return () => {
        try {
            f();
        } catch (error) {
            print(error);
            print(error.stack);
        }
    }
}

function registerShortcutDbg(title, text, keySequence, callback) {
    registerShortcut(title, text, keySequence, catchWrap(callback))
}

function registerShortcuts() {
    registerShortcutDbg("basalt-focus-left", "Basalt: Move focus left", "Meta+A", focusLeft);
    registerShortcutDbg("basalt-focus-right", "Basalt: Move focus right", "Meta+D", focusRight);
    registerShortcutDbg("basalt-focus-up", "Basalt: Move focus up", "Meta+W", focusUp);
    registerShortcutDbg("basalt-focus-down", "Basalt: Move focus down", "Meta+S", focusDown);

    registerShortcutDbg("basalt-window-move-left", "Basalt: Move window left", "Meta+Shift+A", windowMoveLeft);
    registerShortcutDbg("basalt-window-move-right", "Basalt: Move window right", "Meta+Shift+D", windowMoveRight);
    registerShortcutDbg("basalt-window-move-up", "Basalt: Move window up", "Meta+Shift+W", windowMoveUp);
    registerShortcutDbg("basalt-window-move-down", "Basalt: Move window down", "Meta+Shift+S", windowMoveDown);

    registerShortcutDbg("basalt-window-toggle-floating", "Basalt: Toggle floating", "Meta+Space", windowToggleFloating);

    registerShortcutDbg("basalt-column-move-left", "Basalt: Move column left", "Meta+Ctrl+Shift+A", columnMoveLeft);
    registerShortcutDbg("basalt-column-move-right", "Basalt: Move column right", "Meta+Ctrl+Shift+D", columnMoveRight);

    registerShortcutDbg("basalt-grid-scroll-left", "Basalt: Scroll left", "Meta+PgUp", gridScrollLeft);
    registerShortcutDbg("basalt-grid-scroll-right", "Basalt: Scroll right", "Meta+PgDown", gridScrollRight);

    registerShortcutDbg("basalt-grid-scroll-left-column", "Basalt: Scroll one column to the left", "Meta+Alt+A", gridScrollLeftColumn);
    registerShortcutDbg("basalt-grid-scroll-right-column", "Basalt: Scroll one column to the right", "Meta+Alt+D", gridScrollRightColumn);
}
