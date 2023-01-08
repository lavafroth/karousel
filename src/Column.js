class Column {
    constructor() {
        this.grid = null;
        this.windows = new LinkedList(); // private
        this.width = null; // private
    }

    addWindow(window) {
        window.column = this;

        this.windows.insertEnd(window);
        if (this.width === null) {
            this.setWidth(window.preferredWidth);
        }
        // TODO: also change column width if the new window requires it

        this.resizeWindows();
    }

    removeWindow(window) {
        window.column = null;
        this.windows.remove(window);
        this.resizeWindows();
        if (this.grid !== null) {
            this.grid.onColumnRemoveWindow(this, window); // TODO: use signal
        }
    }

    moveWindowsTo(targetColumn) {
        for (const window of this.windows.iterator()) {
            this.removeWindow(window);
            targetColumn.addWindow(window);
        }
    }

    moveWindowUp(window) {
        this.windows.moveBack(window);
    }

    moveWindowDown(window) {
        this.windows.moveForward(window);
    }

    getWindowCount() {
        return this.windows.length();
    }

    isEmpty() {
        return this.getWindowCount() === 0;
    }

    setGrid(grid) {
        this.grid = grid;
        this.resizeWindows();
    }

    getWidth() {
        assert(this.width !== null);
        return this.width;
    }

    setWidth(width) {
        this.width = width;
        for (const window of this.windows.iterator()) {
            window.preferredWidth = width;
        }
    }

    resizeWindows() {
        const nWindows = this.windows.length();
        if (nWindows === 0) {
            return;
        }

        if (this.grid === null) {
            // this column is not attached to a grid, no sense in resizing windows
            return;
        }

        let remainingPixels = this.grid.area.height - 2*GAPS_OUTER.y - (nWindows-1)*GAPS_INNER.y;
        let remainingWindows = nWindows;
        for (const window of this.windows.iterator()) {
            const windowHeight = Math.round(remainingPixels / remainingWindows);
            window.height = windowHeight;
            remainingPixels -= windowHeight;
            remainingWindows--;
        }
        // TODO: respect min height and unresizable windows
    }

    arrange(x) {
        if (this.grid === null) {
            // this column is not attached to a grid, no sense in arranging windows
            return;
        }

        let y = this.grid.area.y + GAPS_OUTER.y;
        for (const window of this.windows.iterator()) {
            if (!window.skipArrange) {
                window.setRect(x, y, this.getWidth(), window.height);
            }
            y += window.height + GAPS_INNER.y;
        }
    }
}
