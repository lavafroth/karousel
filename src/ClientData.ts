class ClientData {
    private state: ClientState;

    constructor(initialState: ClientState) {
        this.state = initialState;
    }

    setState(newState: ClientState, passFocus: boolean) {
        this.state.destroy(passFocus);
        this.state = newState;
    }

    getState() {
        return this.state;
    }

    destroy(passFocus: boolean) {
        this.state.destroy(passFocus);
    }
}

type ClientState = ClientStateTiled;

class ClientStateTiled {
    window: Window;
    private signalManager: SignalManager;

    constructor(world: World, window: Window) {
        this.window = window;
        this.signalManager = initClientTiledSignalHandlers(world, window);
    }

    destroy(passFocus: boolean) {
        this.signalManager.disconnect();

        const window = this.window;
        const grid = window.column.grid;
        const clientWrapper = window.client;
        window.destroy(passFocus);
        grid.arrange();

        clientWrapper.prepareForFloating(grid.clientArea);
    }
}
