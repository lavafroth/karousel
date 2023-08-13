class ScrollView {
    public readonly world: World;
    public readonly grid: Grid;
    public readonly desktop: number;
    private readonly config: ScrollView.Config;
    private scrollX: number;
    public clientArea: QRect;
    public tilingArea: QRect;

    constructor(world: World, desktop: number, config: ScrollView.Config, layoutConfig: LayoutConfig) {
        this.config = config;
        this.world = world;
        this.scrollX = 0;
        this.desktop = desktop;
        this.grid = new Grid(this, layoutConfig);
        this.updateArea();
    }

    updateArea() {
        const newClientArea = workspace.clientArea(workspace.PlacementArea, 0, this.desktop);
        if (newClientArea === this.clientArea) {
            return;
        }

        this.clientArea = newClientArea;
        this.tilingArea = Qt.rect(
            newClientArea.x + this.config.marginLeft,
            newClientArea.y + this.config.marginTop,
            newClientArea.width - this.config.marginLeft - this.config.marginRight,
            newClientArea.height - this.config.marginTop - this.config.marginBottom,
        )
        this.grid.onScreenSizeChanged();

        this.autoAdjustScroll();
    }

    // calculates ScrollPos that scrolls the column into view
    public getScrollPosForColumn(column: Column) {
        const left = column.getLeft();
        const right = column.getRight();
        const initialScrollPos = this.getCurrentScrollPos();

        let targetScrollX: number;
        if (left < initialScrollPos.getLeft()) {
            targetScrollX = this.clampScrollX(left);
        } else if (right > initialScrollPos.getRight()) {
            targetScrollX = this.clampScrollX(right - this.tilingArea.width);
        } else {
            return this.getScrollPos(this.clampScrollX(this.scrollX));
        }

        const overscroll = this.getTargetOverscroll(targetScrollX, left < initialScrollPos.getLeft());
        return this.getScrollPos(this.clampScrollX(targetScrollX + overscroll));
    }

    private getTargetOverscroll(targetScrollX: number, scrollLeft: boolean) {
        if (this.config.overscroll === 0) {
            return 0;
        }
        const visibleColumnsWidth = this.grid.getVisibleColumnsWidth(this.getScrollPos(targetScrollX), true);
        const remainingSpace = this.tilingArea.width - visibleColumnsWidth;
        const overscrollX = Math.min(this.config.overscroll, Math.round(remainingSpace / 2));
        const direction = scrollLeft ? -1 : 1;
        return overscrollX * direction;
    }

    scrollToColumn(column: Column) {
        this.scrollX = this.getScrollPosForColumn(column).x;
    }

    scrollCenterColumn(column: Column) {
        const windowCenter = column.getLeft() + column.getWidth() / 2;
        const screenCenter = this.scrollX + this.tilingArea.width / 2;
        this.adjustScroll(Math.round(windowCenter - screenCenter), false);
    }

    private autoAdjustScroll() {
        const focusedWindow = this.world.getFocusedWindow();
        if (focusedWindow === null) {
            this.removeOverscroll();
            return;
        }

        const column = focusedWindow.column;
        if (column.grid !== this.grid) {
            return;
        }
        this.scrollToColumn(column);
    }

    private getScrollPos(scrollX: number) {
        return new ScrollPos(scrollX, this.tilingArea.width);
    }

    public getCurrentScrollPos() {
        return this.getScrollPos(this.scrollX);
    }

    private clampScrollX(x: number) {
        let minScroll = 0;
        let maxScroll = this.grid.getWidth() - this.tilingArea.width;
        if (maxScroll < 0) {
            const centerScroll = Math.round(maxScroll / 2);
            minScroll = centerScroll;
            maxScroll = centerScroll;
        }
        return clamp(x, minScroll, maxScroll);
    }

    private setScroll(x: number, force: boolean) {
        this.scrollX = force ? x : this.clampScrollX(x);
    }

    private applyScrollPos(scrollPos: ScrollPos) {
        this.scrollX = scrollPos.x;
    }

    adjustScroll(dx: number, force: boolean) {
        this.setScroll(this.scrollX + dx, force);
    }

    private removeOverscroll() {
        this.setScroll(this.scrollX, false);
    }

    public arrange() {
        // TODO (optimization): only arrange visible windows
        this.updateArea();
        this.grid.arrange(this.tilingArea.x - this.scrollX);
    }

    public onGridWidthChanged() {
        this.autoAdjustScroll();
    }

    public onGridReordered() {
        this.autoAdjustScroll();
    }

    public destroy() {
        this.grid.destroy();
    }
}

module ScrollView {
    export type Config = {
        marginTop: number,
        marginBottom: number,
        marginLeft: number,
        marginRight: number,
        overscroll: number,
    }
}
