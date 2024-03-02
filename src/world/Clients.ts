namespace Clients {
    export function canTileEver(kwinClient: KwinClient) {
        return kwinClient.resizeable;
    }

    export function canTileNow(kwinClient: KwinClient) {
        return canTileEver(kwinClient) && !kwinClient.minimized && kwinClient.desktop > 0 && kwinClient.activities.length === 1;
    }

    export function makeTileable(kwinClient: KwinClient) {
        if (kwinClient.minimized) {
            kwinClient.minimized = false;
        }
        if (kwinClient.desktop <= 0) {
            kwinClient.desktop = Workspace.currentDesktop;
        }
        if (kwinClient.activities.length !== 1) {
            kwinClient.activities = [Workspace.currentActivity];
        }
    }

    export function isMaximizedGeometry(kwinClient: KwinClient) {
        const maximizeArea = Workspace.clientArea(ClientAreaOption.MaximizeArea, kwinClient.screen, kwinClient.desktop);
        return kwinClient.frameGeometry === maximizeArea;
    }

    export function isFullScreenGeometry(kwinClient: KwinClient) {
        const fullScreenArea = Workspace.clientArea(ClientAreaOption.FullScreenArea, kwinClient.screen, kwinClient.desktop);
        return kwinClient.frameGeometry === fullScreenArea;
    }

    export function isOnVirtualDesktop(kwinClient: KwinClient, desktopNumber: number) {
        return kwinClient.desktop === desktopNumber || kwinClient.desktop === -1;
    }
}
