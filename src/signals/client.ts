function initClientSignalHandlers(world: World, window: Window) {
    const kwinClient = window.kwinClient;
    const manager = new SignalManager();

    manager.connect(kwinClient.desktopChanged, () => {
        if (window.kwinClient.desktop === -1) {
            // windows on all desktops are not supported
            world.removeClient(window.kwinClient, false);
        }
    });

    let lastResize = false;
    manager.connect(kwinClient.moveResizedChanged, () => {
        const kwinClient = window.kwinClient;
        if (kwinClient.move) {
            world.removeClient(kwinClient, false);
            return;
        }

        const grid = window.column.grid;
        const resize = kwinClient.resize;
        if (!lastResize && resize) {
            grid.onUserResizeStarted();
        }
        if (lastResize && !resize) {
            grid.onUserResizeFinished();
        }
        lastResize = resize;
    });

    manager.connect(kwinClient.frameGeometryChanged, (kwinClient: TopLevel, oldGeometry: QRect) => {
        if (kwinClient.resize) {
            const newGeometry = kwinClient.frameGeometry;
            const column = window.column;
            const grid = column.grid;

            const widthDelta = newGeometry.width - oldGeometry.width;
            const heightDelta = newGeometry.height - oldGeometry.height;
            if (widthDelta !== 0) {
                column.adjustWidth(widthDelta, true);
                if (newGeometry.x !== oldGeometry.x) {
                    grid.adjustScroll(widthDelta, true);
                }
            }
            if (heightDelta !== 0) {
                column.adjustWindowHeight(window, heightDelta, newGeometry.y !== oldGeometry.y);
            }
            if (widthDelta !== 0 || heightDelta !== 0) {
                grid.arrange();
            }
        }
    });

    return manager;
}
