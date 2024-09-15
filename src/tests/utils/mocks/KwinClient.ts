namespace Mocks {
    export class KwinClient {
        private static readonly borderThickness = 10;

        public readonly shadeable: boolean = false;
        public readonly minSize: Readonly<QmlSize> = new QmlSize(0, 0);
        public readonly transient: boolean = false;
        public readonly transientFor: KwinClient | null = null;
        public readonly move: boolean = false;
        public readonly resize: boolean = false;
        public readonly moveable: boolean = false;
        public readonly resizeable: boolean = false;
        public readonly fullScreenable: boolean = false;
        public readonly maximizable: boolean = false;
        public readonly output: Output = false;
        public readonly dock: boolean = false;
        public readonly normalWindow: boolean = false;
        public readonly managed: boolean = false;
        public readonly popupWindow: boolean = false;

        private _fullScreen: boolean = false;
        public activities: string[] = [];
        public skipSwitcher: boolean = false;
        public keepAbove: boolean = false;
        public keepBelow: boolean = false;
        public shade: boolean = false;
        public minimized: boolean = false;
        public desktops: KwinDesktop[] = [];
        public tile: Tile = false;
        public opacity: number = 1.0;

        public readonly fullScreenChanged: QSignal<[]> = new QSignal();
        public readonly desktopsChanged: QSignal<[]> = new QSignal();
        public readonly activitiesChanged: QSignal<[]> = new QSignal();
        public readonly minimizedChanged: QSignal<[]> = new QSignal();
        public readonly maximizedAboutToChange: QSignal<[MaximizedMode]> = new QSignal();
        public readonly captionChanged: QSignal<[]> = new QSignal();
        public readonly tileChanged: QSignal<[]> = new QSignal();
        public readonly interactiveMoveResizeStarted: QSignal<[]> = new QSignal();
        public readonly interactiveMoveResizeFinished: QSignal<[]> = new QSignal();
        public readonly frameGeometryChanged: QSignal<[oldGeometry: QmlRect]> = new QSignal();

        private windowedFrameGeometry: QmlRect;
        private windowed: boolean = false;

        constructor(
            public readonly pid: number,
            public readonly resourceClass: string,
            public readonly caption: string,
            private _frameGeometry: QmlRect,
        ) {
            this.windowedFrameGeometry = _frameGeometry.clone();
        }

        setMaximize(vertically: boolean, horizontally: boolean) {
            this.maximizedAboutToChange.fire(
                vertically ? (
                    horizontally ? MaximizedMode.Maximized : MaximizedMode.Vertically
                ) : (
                    horizontally ? MaximizedMode.Horizontally : MaximizedMode.Unmaximized
                )
            );
        }

        public get clientGeometry() {
            if (this._fullScreen) {
                return this.frameGeometry;
            }

            return new QmlRect(
                this.frameGeometry.x + KwinClient.borderThickness,
                this.frameGeometry.y + KwinClient.borderThickness,
                this.frameGeometry.width - 2 * KwinClient.borderThickness,
                this.frameGeometry.height - 2 * KwinClient.borderThickness,
            );
        }

        public get fullScreen() {
            return this._fullScreen;
        }

        public set fullScreen(fullScreen: boolean) {
            this.windowed = !fullScreen;
            this._fullScreen = fullScreen;
            this.fullScreenChanged.fire();

            if (fullScreen) {
                this.frameGeometry = new QmlRect(0, 0, screenWidth, screenHeight);
            } else {
                this.frameGeometry = this.windowedFrameGeometry;
            }
        }

        public get frameGeometry() {
            return this._frameGeometry;
        }

        public set frameGeometry(frameGeometry: QmlRect) {
            const oldFrameGeometry = this._frameGeometry;
            this._frameGeometry = new QmlRect(
                frameGeometry.x,
                frameGeometry.y,
                frameGeometry.width,
                frameGeometry.height,
                this.frameGeometryChanged.fire,
            );
            if (this.windowed) {
                this.windowedFrameGeometry = this._frameGeometry.clone();
            }
            this.frameGeometryChanged.fire(oldFrameGeometry);
        }
    }
}
