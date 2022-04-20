import { Earthstar, Rpc } from "../../deps.ts";
import { IReplicaServerExtension } from "./extension.ts";

interface ExtensionSyncOpts {
  path?: string;
}

export class ExtensionSyncWebsocket implements IReplicaServerExtension {
  private syncer: Earthstar.Syncer<Rpc.TransportWebsocketServer<any>> | null =
    null;
  private path = "/";

  constructor(opts: ExtensionSyncOpts) {
    if (opts.path) {
      this.path = opts.path;
    }
  }

  register(peer: Earthstar.Peer) {
    this.syncer = new Earthstar.Syncer(
      peer,
      (methods) =>
        new Rpc.TransportWebsocketServer({
          deviceId: peer.peerId,
          methods,
        }),
    );

    return Promise.resolve();
  }

  handler(req: Request) {
    const url = new URL(req.url);

    if (this.syncer && url.pathname === this.path) {
      return Promise.resolve(this.syncer.transport.handler(req));
    }

    return Promise.resolve(null);
  }
}
