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
    registerShortcutDbg("basalt-window-move-left", "Basalt: Move window left", "Meta+Shift+A", windowMoveLeft);
    registerShortcutDbg("basalt-window-move-right", "Basalt: Move window right", "Meta+Shift+D", windowMoveRight);
    registerShortcutDbg("basalt-window-move-up", "Basalt: Move window up", "Meta+Shift+W", windowMoveUp);
    registerShortcutDbg("basalt-window-move-down", "Basalt: Move window down", "Meta+Shift+S", windowMoveDown);
    registerShortcutDbg("basalt-window-toggle-floating", "Basalt: Toggle floating", "Meta+Space", windowToggleFloating);
    registerShortcutDbg("basalt-column-move-left", "Basalt: Move column left", "Meta+Ctrl+Shift+A", columnMoveLeft);
    registerShortcutDbg("basalt-column-move-right", "Basalt: Move column right", "Meta+Ctrl+Shift+D", columnMoveRight);
}
