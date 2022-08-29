import { deferred } from "https://deno.land/std@0.138.0/async/deferred.ts";
import { Earthstar } from "../../deps.ts";
import { IReplicaServerExtension } from "./extension.ts";

/**
 * - `path`: The path to accept HTTP sync requests from, e.g. `/earthstar-api/v2`. Make sure to set this if you're using other extensions which handle requests, as by default this will match any request to /.
 */
interface ExtensionSyncOpts<F> {
  path?: string;
  formats?: Earthstar.FormatsArg<F>;
}

/** An extension which enables synchronisation over the web via HTTP. */
export class ExtensionSyncWeb<F> implements IReplicaServerExtension {
  private path = "";
  private syncers = new Map<string, Earthstar.Syncer<WebSocket, F>>();
  private peer = deferred<Earthstar.Peer>();
  private formats: Earthstar.FormatsArg<F> | undefined;

  constructor(opts: ExtensionSyncOpts<F>) {
    if (opts.path) {
      this.path = opts.path;
    }

    if (opts.formats) {
      this.formats = opts.formats;
    }
  }

  register(peer: Earthstar.Peer) {
    this.peer.resolve(peer);

    return Promise.resolve();
  }

  async handler(req: Request): Promise<Response | null> {
    const transferPattern = new URLPattern({
      pathname:
        `${this.path}/:syncerId/:kind/:shareAddress/:formatName/:author/:path*`,
    });

    const initiatePattern = new URLPattern({
      pathname: `${this.path}/:mode`,
    });

    const transferMatch = transferPattern.exec(req.url);

    if (transferMatch) {
      const { syncerId, shareAddress, formatName, path, author, kind } =
        transferMatch.pathname.groups;

      const syncer = this.syncers.get(syncerId);

      if (!syncer) {
        return new Response("Not found", {
          status: 404,
        });
      }

      const { socket, response } = Deno.upgradeWebSocket(req);

      await syncer.handleTransferRequest({
        shareAddress,
        formatName,
        path: `/${path}`,
        author,
        kind: kind as "download" | "upload",
        source: socket,
      });

      return response;
    }

    const initiateMatch = initiatePattern.exec(req.url);

    if (initiateMatch) {
      const { socket, response } = Deno.upgradeWebSocket(req, {});

      const partner = new Earthstar.PartnerWebServer({ socket });

      const peer = await this.peer;

      const { mode } = initiateMatch.pathname.groups;

      if (mode !== "once" && mode !== "live") {
        return Promise.resolve(null);
      }

      const newSyncer = new Earthstar.Syncer({
        partner,
        mode,
        peer,
        formats: this.formats,
      });

      console.log(`Syncer ${newSyncer.id}: started`);

      newSyncer.isDone.then(() => {
        console.log(`Syncer ${newSyncer.id}: completed`);
      }).catch((err) => {
        console.error(console.log(`Syncer ${newSyncer.id}: cancelled`), err);
      }).finally(() => {
        this.syncers.delete(newSyncer.id);
      });

      this.syncers.set(newSyncer.id, newSyncer);

      return response;
    }

    return Promise.resolve(null);
  }
}
