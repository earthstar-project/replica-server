import { Earthstar, Rpc } from "../../deps.ts";
import { IReplicaServerExtension } from "./extension.ts";

/**
 * - `path`: The path to accept HTTP sync requests from, e.g. `/earthstar-api/v2`. Make sure to set this if you're using other extensions which handle requests, as by default this is set to `/`.
 */
interface ExtensionSyncOpts {
  path?: string;
}

/** An extension which enables synchronisation over a Websocket connection. */
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
