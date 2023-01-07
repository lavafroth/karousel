class Window {
    constructor(client) {
        this.column = null;
        this.client = client;
        this.height = client.frameGeometry.height;
        this.preferredWidth = client.frameGeometry.width;
        this.skipArrange = false;
        this.floatingState = {
            width: client.frameGeometry.width,
            height: client.frameGeometry.height,
            keepAbove: client.keepAbove,
            keepBelow: client.keepBelow,
        };
    }

    setRect(x, y, width, height) {
        const rect = this.client.frameGeometry;
        rect.x = x;
        rect.y = y;
        rect.width = width;
        rect.height = height;
    }

    connectToSignals() {
        this.client.frameGeometryChanged.connect(this.frameGeometryChanged);
    }

    disconnectFromSignals() {
        this.client.frameGeometryChanged.disconnect(this.frameGeometryChanged);
    }

    frameGeometryChanged(client, oldGeometry) {
        print("client frameGeometryChanged", client, oldGeometry);
    }
}
