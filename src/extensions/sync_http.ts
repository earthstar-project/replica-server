import { Earthstar, Rpc } from "../../deps.ts";
import { IReplicaServerExtension } from "./extension.ts";

/**
 * - `path`: The path to accept HTTP sync requests from, e.g. `/earthstar-api/v2`. Make sure to set this if you're using other extensions which handle requests, as by default this is set to `/`.
 */
interface ExtensionSyncOpts {
  path?: string;
}

/** An extension which enables synchronisation over HTTP. */
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

  async handler(req: Request): Promise<Response | null> {
    const pathname = new URL(req.url).pathname;

    if (this.syncer && pathname.startsWith(this.path)) {
      // Typecasting is because of earthstar-streaming-rpc and node-fetch type discrepancies.
      const response = await this.syncer.transport.handler(req) as Response;

      response.headers.append(
        "Access-Control-Allow-Headers",
        "Content-Type, Access-Control-Allow-Headers",
      );

      response.headers.append(
        "Access-Control-Allow-Origin",
        "*",
      );

      return response;
    }

    return Promise.resolve(null);
  }
}
