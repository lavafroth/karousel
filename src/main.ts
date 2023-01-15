class Basalt {
    private world: World;
    private workspaceSignalManager: SignalManager;

    constructor(world: World, workspaceSignalManager: SignalManager) {
        this.world = world;
        this.workspaceSignalManager = workspaceSignalManager;
    }

    shutdown() {
        this.workspaceSignalManager.disconnect();
        this.world.removeAllClients();
    }
}

function init() {
    const workspaceSignalManager = initWorkspaceSignalHandlers(world);
    registerShortcuts();
    return new Basalt(world, workspaceSignalManager);
}

const world = new World(workspace.desktops);
