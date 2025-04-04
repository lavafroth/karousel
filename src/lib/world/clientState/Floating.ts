namespace ClientState {
    export class Floating implements State {
        private readonly client: ClientWrapper;
        private readonly config: ClientManager.Config;
        private readonly signalManager: SignalManager;

        constructor(world: World, client: ClientWrapper, config: ClientManager.Config, limitHeight: boolean) {
            this.client = client;
            this.config = config;
            if (config.floatingKeepAbove) {
                client.kwinClient.keepAbove = true;
            }
            if (limitHeight && client.kwinClient.tile === null) {
                Floating.limitHeight(client);
            }
            this.signalManager = Floating.initSignalManager(world, client.kwinClient);
        }

        public destroy(passFocus: boolean) {
            this.signalManager.destroy();
        }

        // TODO: move to `Tiled.restoreClientAfterTiling`
        private static limitHeight(client: ClientWrapper) {
            const placementArea = Workspace.clientArea(
                ClientAreaOption.PlacementArea,
                client.kwinClient.output,
                Clients.getKwinDesktopApprox(client.kwinClient),
            );
            const clientRect = client.kwinClient.frameGeometry;
            const width = client.preferredWidth;
            client.place(
                clientRect.x,
                clientRect.y,
                width,
                Math.min(clientRect.height, Math.round(placementArea.height / 2)),
            );
        }

        private static initSignalManager(world: World, kwinClient: KwinClient) {
            const manager = new SignalManager();

            manager.connect(kwinClient.tileChanged, () => {
                // on X11, this fires after `frameGeometryChanged`
                if (kwinClient.tile !== null) {
                    world.do((clientManager, desktopManager) => {
                        clientManager.pinClient(kwinClient);
                    });
                }
            });

            manager.connect(kwinClient.frameGeometryChanged, () => {
                // on Wayland, this fires after `tileChanged`
                if (kwinClient.tile !== null) {
                    world.do((clientManager, desktopManager) => {
                        clientManager.pinClient(kwinClient);
                    });
                }
            });

            return manager;
        }
    }
}
