class Gesturer {
    private readonly handler: SwipeGestureHandler;
    constructor(direction: string, f: () => void) {
        this.handler = <SwipeGestureHandler>Qt.createQmlObject(
            `import QtQuick
import org.kde.kwin
SwipeGestureHandler {
    direction: SwipeGestureHandler.Direction.${direction}
    fingerCount: 3
}`,
            qmlBase,
        );
        this.handler.activated.connect(f);
    }

    public destroy() {
        this.handler.destroy();
    }
}
