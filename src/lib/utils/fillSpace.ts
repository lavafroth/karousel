function fillSpace(availableSpace: number, items: { min: number, max: number }[]) {
    let mean = Math.floor(availableSpace / items.length);
    while (true) {
        let requiredSpace = 0;
        let increasable = 0;
        let decreasable = 0;
        let low = -Infinity;
        let high = Infinity;
        for (const constraint of items) {
            const value = clamp(mean, constraint.min, constraint.max);
            requiredSpace += value;
            if (mean > constraint.min) {
                decreasable++;
                if (value > low) {
                    low = value;
                }
            }
            if (mean < constraint.max) {
                increasable++;
                if (value < high) {
                    high = value;
                }
            }
        }

        const oldMean = mean;
        const error = requiredSpace - availableSpace;
        if (error > 0) {
            // need to decrease mean
            if (decreasable > 0) {
                mean = Math.floor(low - error / decreasable);
            }
        } else if (error < 0) {
            // need to increase mean
            if (increasable > 0) {
                mean = Math.floor(high - error / increasable);
            }
        }

        if (mean === oldMean) {
            return mean;
        }
    }
}
