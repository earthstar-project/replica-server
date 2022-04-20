import { Earthstar, Rpc } from "../../deps.ts";
import { IReplicaServerExtension } from "./extension.ts";

interface ExtensionSyncOpts {
  path?: string;
}

export class ExtensionSyncHttp implements IReplicaServerExtension {
  private syncer: Earthstar.Syncer<Rpc.TransportHttpServer<any>> | null = null;
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
        new Rpc.TransportHttpServer({
          deviceId: peer.peerId,
          methods,
          path: this.path,
        }),
    );

    return Promise.resolve();
  }

  handler(req: Request): Promise<Response | null> {
    const pathname = new URL(req.url).pathname;

    if (this.syncer && pathname.startsWith(this.path)) {
      // Typecasting is because of earthstar-streaming-rpc and node-fetch type discrepancies.
      return this.syncer.transport.handler(req) as Promise<Response>;
    }

    return Promise.resolve(null);
  }
}
