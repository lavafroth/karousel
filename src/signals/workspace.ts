function initWorkspaceSignalHandlers(world: World) {
    const manager = new SignalManager();

    manager.connect(workspace.desktopPresenceChanged, (kwinClient: AbstractClient, oldDesktop: number) => {
        world.doIfTiled(kwinClient, (window, column, oldGrid) => {
            // all desktops case handled in the client signal handler, because the workspace signal isn't fired for some reason

            const newDesktop = kwinClient.desktop;
            const newGrid = world.getGrid(newDesktop);
            if (newGrid === null) {
                throw new Error("grid does not exist");
            }
            if (oldGrid === newGrid) {
                // window already on the correct grid
                return;
            }

            const newColumn = new Column(newGrid, newGrid.getLastFocusedColumn() ?? newGrid.getLastColumn());
            window.moveToColumn(newColumn);
            oldGrid.arrange();
            newGrid.arrange();
        });
    });

    manager.connect(workspace.currentDesktopChanged, (desktop: number, kwinClient: AbstractClient) => {
        console.log("workspace currentDesktopChanged", desktop, kwinClient);
    });

    manager.connect(workspace.clientAdded, (kwinClient: AbstractClient) => {
        console.assert(!world.hasClient(kwinClient));
        if (kwinClient.dock) {
            // TODO: also detect when a dock is moved
            world.onScreenResized();
            return;
        }
        if (shouldTile(kwinClient)) {
            world.addClient(kwinClient);
        }
    });

    manager.connect(workspace.clientRemoved, (kwinClient: AbstractClient) => {
        if (kwinClient.dock) {
            world.onScreenResized();
            return;
        }
        if (world.hasClient(kwinClient)) {
            world.removeClient(kwinClient, true);
        }
        world.minimizedTiled.delete(kwinClient);
    });

    manager.connect(workspace.clientManaging, (kwinClient: X11Client) => {
        console.log("workspace clientManaging", kwinClient);
    });

    manager.connect(workspace.clientMinimized, (kwinClient: AbstractClient) => {
        if (world.hasClient(kwinClient)) {
            world.removeClient(kwinClient, true);
            world.minimizedTiled.add(kwinClient);
        }
    });

    manager.connect(workspace.clientUnminimized, (kwinClient: AbstractClient) => {
        console.assert(!world.hasClient(kwinClient));
        if (world.minimizedTiled.has(kwinClient)) {
            world.minimizedTiled.delete(kwinClient);
            world.addClient(kwinClient);
        }
    });

    manager.connect(workspace.clientRestored, (kwinClient: X11Client) => {
        console.log("workspace clientRestored", kwinClient);
    });

    manager.connect(workspace.clientMaximizeSet, (kwinClient: AbstractClient, horizontally: boolean, vertically: boolean) => {
        world.doIfTiled(kwinClient, (window, column, grid) => {
            window.onMaximizedChanged(horizontally, vertically);
            grid.arrange();
        });
    });

    manager.connect(workspace.killWindowCalled, (kwinClient: X11Client) => {
        console.log("workspace killWindowCalled", kwinClient);
    });

    manager.connect(workspace.clientActivated, (kwinClient: AbstractClient) => {
        if (kwinClient === null) {
            return;
        }
        world.onClientFocused(kwinClient);
        world.doIfTiled(kwinClient, (window, column, grid) => {
            window.onFocused();
            grid.arrange();
        });
    });

    manager.connect(workspace.clientFullScreenSet, (kwinClient: X11Client, fullScreen: boolean, user: boolean) => {
        world.doIfTiled(kwinClient, (window, column, grid) => {
            window.onFullScreenChanged(fullScreen);
            grid.arrange();
        });
    });

    manager.connect(workspace.clientSetKeepAbove, (kwinClient: X11Client, keepAbove: boolean) => {
        console.log("workspace clientSetKeepAbove", kwinClient, keepAbove);
    });

    manager.connect(workspace.numberDesktopsChanged, (oldNumberOfDesktops: number) => {
        world.updateDesktops();
    });

    manager.connect(workspace.desktopLayoutChanged, () => {
        console.log("workspace desktopLayoutChanged");
    });

    manager.connect(workspace.clientDemandsAttentionChanged, (kwinClient: AbstractClient, set: boolean) => {
        console.log("workspace clientDemandsAttentionChanged", kwinClient, set);
    });

    manager.connect(workspace.numberScreensChanged, (count: number) => {
        console.log("workspace numberScreensChanged", count);
    });

    manager.connect(workspace.currentActivityChanged, (id: string) => {
        console.log("workspace currentActivityChanged", id);
    });

    manager.connect(workspace.activitiesChanged, (id: string) => {
        console.log("workspace activitiesChanged", id);
    });

    manager.connect(workspace.activityAdded, (id: string) => {
        console.log("workspace activityAdded", id);
    });

    manager.connect(workspace.activityRemoved, (id: string) => {
        console.log("workspace activityRemoved", id);
    });

    manager.connect(workspace.virtualScreenSizeChanged, () => {
        world.onScreenResized();
    });

    return manager;
}
