class World {
    public readonly config: Config;
    private readonly gridManager: GridManager;
    private readonly clientMap: Map<AbstractClient, ClientWrapper>;
    private lastFocusedClient: AbstractClient|null;
    private readonly workspaceSignalManager: SignalManager;
    private readonly windowRuleEnforcer: WindowRuleEnforcer;
    private readonly screenResizedDelayer: Delayer;

    constructor(config: Config) {
        this.config = config;
        this.clientMap = new Map();
        this.lastFocusedClient = null;
        this.workspaceSignalManager = initWorkspaceSignalHandlers(this);

        let parsedWindowRules: WindowRule[] = [];
        try {
            parsedWindowRules = JSON.parse(config.windowRules);
        } catch (error: any) {
            console.log("failed to parse windowRules:", error);
        }
        this.windowRuleEnforcer = new WindowRuleEnforcer(this, parsedWindowRules);

        this.screenResizedDelayer = new Delayer(1000, () => {
            // this delay ensures that docks get taken into account by `workspace.clientArea`
            const gridManager = this.gridManager; // workaround for bug in Qt5's JS engine
            for (const grid of gridManager.grids()) {
                grid.arrange();
            }
        });

        this.gridManager = new GridManager(this, workspace.currentActivity, workspace.desktops);
        this.addExistingClients();
    }

    updateDesktops() {
        this.gridManager.setNDesktops(workspace.desktops);
    }

    private addExistingClients() {
        const kwinClients = workspace.clientList();
        for (let i = 0; i < kwinClients.length; i++) {
            const kwinClient = kwinClients[i];
            this.addClient(kwinClient);
        }
    }

    getGrid(activity: string, desktopNumber: number) {
        console.assert(desktopNumber > 0 && desktopNumber <= workspace.desktops);
        return this.gridManager.get(activity, desktopNumber);
    }

    getGridInCurrentActivity(desktopNumber: number) {
        return this.getGrid(workspace.currentActivity, desktopNumber);
    }

    getCurrentGrid() {
        return this.getGrid(workspace.currentActivity, workspace.currentDesktop);
    }

    getClientGrid(kwinClient: AbstractClient) {
        console.assert(kwinClient.activities.length === 1);
        return this.getGrid(kwinClient.activities[0], kwinClient.desktop);
    }

    addClient(kwinClient: AbstractClient) {
        const rulesSignalManager = this.windowRuleEnforcer.initClientSignalManager(this, kwinClient);
        const client = new ClientWrapper(kwinClient, new ClientStateFloating(), rulesSignalManager);
        this.clientMap.set(kwinClient, client);
        if (kwinClient.dock) {
            client.stateManager.setState(new ClientStateDocked(this, kwinClient), false);
        } else if (this.windowRuleEnforcer.shouldTile(kwinClient)) {
            client.stateManager.setState(new ClientStateTiled(this, client), false);
        }
    }

    removeClient(kwinClient: AbstractClient, passFocus: boolean) {
        const client = this.clientMap.get(kwinClient);
        if (client === undefined) {
            return;
        }
        client.destroy(passFocus && kwinClient === this.lastFocusedClient);
        this.clientMap.delete(kwinClient);
    }

    minimizeClient(kwinClient: AbstractClient) {
        const client = this.clientMap.get(kwinClient);
        if (client === undefined) {
            return;
        }
        if (client.stateManager.getState() instanceof ClientStateTiled) {
            client.stateManager.setState(new ClientStateTiledMinimized(), kwinClient === this.lastFocusedClient);
        }
    }

    unminimizeClient(kwinClient: AbstractClient) {
        const client = this.clientMap.get(kwinClient);
        if (client === undefined) {
            return;
        }
        if (client.stateManager.getState() instanceof ClientStateTiledMinimized) {
            client.stateManager.setState(new ClientStateTiled(this, client), false);
        }
    }

    tileClient(kwinClient: AbstractClient) {
        const client = this.clientMap.get(kwinClient);
        if (client === undefined) {
            return;
        }
        if (client.stateManager.getState() instanceof ClientStateTiled) {
            return;
        }
        client.stateManager.setState(new ClientStateTiled(this, client), false);
    }

    untileClient(kwinClient: AbstractClient) {
        const client = this.clientMap.get(kwinClient);
        if (client === undefined) {
            return;
        }
        if (client.stateManager.getState() instanceof ClientStateTiled) {
            client.stateManager.setState(new ClientStateFloating(), false);
        }
    }

    toggleFloatingClient(kwinClient: AbstractClient) {
        const client = this.clientMap.get(kwinClient);
        if (client === undefined) {
            return;
        }

        const clientState = client.stateManager.getState();
        if (clientState instanceof ClientStateFloating && canTileEver(kwinClient)) {
            makeTileable(kwinClient);
            client.stateManager.setState(new ClientStateTiled(this, client), false);
        } else if (clientState instanceof ClientStateTiled) {
            client.stateManager.setState(new ClientStateFloating(), false);
        }
    }

    hasClient(kwinClient: AbstractClient) {
        return this.clientMap.has(kwinClient);
    }

    onClientFocused(kwinClient: AbstractClient) {
        this.lastFocusedClient = kwinClient;
    }

    doIfTiled(kwinClient: AbstractClient, f: (window: Window, column: Column, grid: Grid) => void) {
        const client = this.clientMap.get(kwinClient);
        if (client === undefined) {
            return;
        }

        const clientState = client.stateManager.getState();
        if (clientState instanceof ClientStateTiled) {
            const window = clientState.window;
            const column = window.column;
            const grid = column.grid;
            f(window, column, grid);
        }
    }

    doIfTiledFocused(f: (window: Window, column: Column, grid: Grid) => void) {
        this.doIfTiled(workspace.activeClient, f);
    }

    getFocusedWindow() {
        const activeClient = workspace.activeClient;
        if (activeClient === null) {
            return null;
        }
        const client = this.clientMap.get(activeClient);
        if (client === undefined) {
            return null;
        }
        const clientState = client.stateManager.getState();
        if (clientState instanceof ClientStateTiled) {
            return clientState.window;
        } else {
            return null;
        }
    }

    removeAllClients() {
        for (const kwinClient of Array.from(this.clientMap.keys())) {
            this.removeClient(kwinClient, false);
        }
    }

    destroy() {
        this.workspaceSignalManager.destroy();
        this.removeAllClients();
        for (const grid of this.gridManager.grids()) {
            grid.destroy();
        }
    }

    onScreenResized() {
        this.screenResizedDelayer.run();
    }
}
