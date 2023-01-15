class Window {
    public column: Column|null;
    public client: AbstractClient;
    public height: number;
    public preferredWidth: number;
    public skipArrange: boolean;
    private lastResize: boolean;
    public floatingState: { width: number; keepBelow: number; height: number; keepAbove: number };
    private clientSignalHandlers: {
        desktopChanged: () => void;
        moveResizedChanged: () => void;
        frameGeometryChanged: (client: TopLevel, oldGeometry: QRect) => void;
    };

    constructor(client: AbstractClient) {
        this.column = null;
        this.client = client;
        this.height = client.frameGeometry.height;
        this.preferredWidth = client.frameGeometry.width;
        this.skipArrange = false;
        this.lastResize = false;
        this.floatingState = {
            width: client.frameGeometry.width,
            height: client.frameGeometry.height,
            keepAbove: client.keepAbove,
            keepBelow: client.keepBelow,
        };
        this.clientSignalHandlers = this.initClientSignals();
    }

    setRect(x: number, y: number, width: number, height: number) {
        if (this.client.resize) {
            // window is being manually resized, prevent fighting with the user
            return;
        }
        this.client.frameGeometry = Qt.rect(x, y, width, height);
    }

    focus() {
        workspace.activeClient = this.client;
    }

    initClientSignals() {
        const window = this;

        return {
            desktopChanged: () => {
                if (window.client.desktop === -1) {
                    // windows on all desktops are not supported
                    world.removeClient(window.client.windowId);
                }
            },

            moveResizedChanged: () => {
                const client = window.client;
                if (client.move) {
                    world.removeClient(client.windowId);
                    return;
                }

                if (window.column === null || window.column.grid === null) {
                    return;
                }
                const grid = window.column.grid;
                const resize = client.resize;
                grid.allowAutoAdjustScroll = !resize;
                if (this.lastResize && !resize) {
                    // resizing finished
                    grid.autoAdjustScroll();
                    grid.arrange();
                }
                this.lastResize = resize;
            },

            frameGeometryChanged: (client: TopLevel, oldGeometry: QRect) => {
                if (client.resize) {
                    const newGeometry = client.frameGeometry;
                    const column = window.column;
                    if (column === null) {
                        return;
                    }
                    const grid = column.grid;
                    if (grid === null) {
                        return;
                    }

                    const widthDelta = newGeometry.width - oldGeometry.width;
                    const heightDelta = newGeometry.height - oldGeometry.height;
                    if (widthDelta !== 0) {
                        column.adjustWidth(widthDelta);
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
            },
        };
    }

    connectToClientSignals() {
        this.client.desktopChanged.connect(this.clientSignalHandlers.desktopChanged);
        this.client.moveResizedChanged.connect(this.clientSignalHandlers.moveResizedChanged);
        this.client.frameGeometryChanged.connect(this.clientSignalHandlers.frameGeometryChanged);
    }

    disconnectFromClientSignals() {
        this.client.desktopChanged.disconnect(this.clientSignalHandlers.desktopChanged);
        this.client.moveResizedChanged.disconnect(this.clientSignalHandlers.moveResizedChanged);
        this.client.frameGeometryChanged.disconnect(this.clientSignalHandlers.frameGeometryChanged);
    }
}
