class Desktop {
    public readonly grid: Grid;
    public readonly desktopNumber: number;
    private readonly pinManager: PinManager;
    private readonly config: Desktop.Config;
    private scrollX: number;
    private dirty: boolean;
    private dirtyPins: boolean;
    public clientArea: QmlRect;
    public tilingArea: QmlRect;

    constructor(desktopNumber: number, pinManager: PinManager, config: Desktop.Config, layoutConfig: LayoutConfig) {
        this.pinManager = pinManager;
        this.config = config;
        this.scrollX = 0;
        this.dirty = true;
        this.dirtyPins = true;
        this.desktopNumber = desktopNumber;
        this.grid = new Grid(this, layoutConfig);
        this.clientArea = Desktop.getClientArea(desktopNumber);
        this.tilingArea = Desktop.getTilingArea(this.clientArea, desktopNumber, pinManager, config);
    }

    private updateArea() {
        const newClientArea = Desktop.getClientArea(this.desktopNumber);
        if (newClientArea === this.clientArea && !this.dirtyPins) {
            return;
        }
        this.clientArea = newClientArea;
        this.tilingArea = Desktop.getTilingArea(newClientArea, this.desktopNumber, this.pinManager, this.config);
        this.dirty = true;
        this.dirtyPins = false;
        this.grid.onScreenSizeChanged();
        this.autoAdjustScroll();
    }

    private static getClientArea(desktopNumber: number) {
        return workspace.clientArea(ClientAreaOption.PlacementArea, 0, desktopNumber);
    }

    private static getTilingArea(clientArea: QmlRect, desktopNumber: number, pinManager: PinManager, config: Desktop.Config) {
        const availableSpace = pinManager.getAvailableSpace(desktopNumber, clientArea);
        const top = availableSpace.top + config.marginTop;
        const bottom = availableSpace.bottom - config.marginBottom;
        const left = availableSpace.left + config.marginLeft;
        const right = availableSpace.right - config.marginRight;
        return Qt.rect(
            left,
            top,
            right - left + 1,
            bottom - top + 1,
        )
    }

    // calculates a Range that scrolls the contained Range into view
    public calculateVisibleRange(containedRange: Desktop.Range) {
        const left = containedRange.getLeft();
        const right = containedRange.getRight();
        const initialVisibleRange = this.getCurrentVisibleRange();

        let targetScrollX: number;
        if (left < initialVisibleRange.getLeft()) {
            targetScrollX = left;
        } else if (right > initialVisibleRange.getRight()) {
            targetScrollX = right - this.tilingArea.width;
        } else {
            return this.getVisibleRange(this.clampScrollX(this.scrollX));
        }

        const overscroll = this.getTargetOverscroll(targetScrollX, left < initialVisibleRange.getLeft());
        return this.getVisibleRange(this.clampScrollX(targetScrollX + overscroll));
    }

    private getTargetOverscroll(targetScrollX: number, scrollLeft: boolean) {
        if (this.config.overscroll === 0) {
            return 0;
        }
        const visibleColumnsWidth = this.grid.getVisibleColumnsWidth(this.getVisibleRange(targetScrollX), true);
        const remainingSpace = this.tilingArea.width - visibleColumnsWidth;
        const overscrollX = Math.min(this.config.overscroll, Math.round(remainingSpace / 2));
        const direction = scrollLeft ? -1 : 1;
        return overscrollX * direction;
    }

    public scrollToRange(range: Desktop.Range) {
        this.setScroll(this.calculateVisibleRange(range).getLeft(), true);
    }

    public scrollCenterRange(range: Desktop.Range) {
        const windowCenter = range.getLeft() + range.getWidth() / 2;
        const screenCenter = this.scrollX + this.tilingArea.width / 2;
        this.adjustScroll(Math.round(windowCenter - screenCenter), false);
    }

    public autoAdjustScroll() {
        const focusedColumn = this.grid.getLastFocusedColumn();
        if (focusedColumn === null) {
            this.removeOverscroll();
            return;
        }

        if (focusedColumn.grid !== this.grid) {
            return;
        }

        this.focusColumn(focusedColumn);
    }

    public focusColumn(column: Column) {
        this.config.scroller.focusColumn(this, column);
    }

    private getVisibleRange(scrollX: number) {
        return new Desktop.RangeImpl(scrollX, this.tilingArea.width);
    }

    public getCurrentVisibleRange() {
        return this.getVisibleRange(this.scrollX);
    }

    private clampScrollX(x: number) {
        let minScroll = 0;
        let maxScroll = this.grid.getWidth() - this.tilingArea.width;
        if (maxScroll < 0) {
            return Math.round(maxScroll / 2);
        }
        return clamp(x, minScroll, maxScroll);
    }

    public setScroll(x: number, force: boolean) {
        const oldScrollX = this.scrollX;
        this.scrollX = force ? x : this.clampScrollX(x);
        if (this.scrollX !== oldScrollX) {
            this.onLayoutChanged();
        }
    }

    public adjustScroll(dx: number, force: boolean) {
        this.setScroll(this.scrollX + dx, force);
    }

    private removeOverscroll() {
        this.setScroll(this.scrollX, false);
    }

    public equalizeVisibleColumnsWidths() {
        const visibleRange = this.getCurrentVisibleRange();
        const visibleColumns = Array.from(this.grid.getVisibleColumns(visibleRange, true));

        let remainingWidth = this.tilingArea.width - (visibleColumns.length-1) * this.grid.config.gapsInnerHorizontal;
        let remainingColumns = visibleColumns.length;
        for (const column of visibleColumns) {
            const columnWidth = Math.round(remainingWidth / remainingColumns);
            column.setWidth(columnWidth, true);
            remainingWidth -= columnWidth;
            remainingColumns--;
        }

        const left = visibleColumns[0].getLeft();
        const right = visibleColumns[visibleColumns.length-1].getRight();
        const targetVisibleRange = new Desktop.RangeImpl(left, right-left);
        this.setScroll(this.calculateVisibleRange(targetVisibleRange).getLeft(), false);
    }

    public arrange() {
        // TODO (optimization): only arrange visible windows
        this.updateArea();
        if (!this.dirty) {
            return;
        }
        this.grid.arrange(this.tilingArea.x - this.scrollX);
        this.dirty = false;
    }

    public onLayoutChanged() {
        this.dirty = true;
    }

    public onPinsChanged() {
        this.dirty = true;
        this.dirtyPins = true;
    }

    public destroy() {
        this.grid.destroy();
    }
}

namespace Desktop {
    export type Config = {
        marginTop: number,
        marginBottom: number,
        marginLeft: number,
        marginRight: number,
        overscroll: number,
        scroller: Desktop.Scroller,
    };

    export type Range = {
        getLeft(): number;
        getRight(): number;
        getWidth(): number;
    }

    export class RangeImpl {
        private readonly x: number;
        private readonly width: number;

        constructor(x: number, width: number) {
            this.x = x;
            this.width = width;
        }

        public getLeft() {
            return this.x;
        }

        public getRight() {
            return this.x + this.width;
        }

        public getWidth() {
            return this.width;
        }
    }

    export type Scroller = {
        focusColumn(desktop: Desktop, column: Column): void;
    }
}
