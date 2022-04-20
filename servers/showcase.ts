import {
  ExtensionServeContent,
  ExtensionServeContentOpts,
  ExtensionShareAllowListJson,
  ExtensionSyncWebsocket,
  ReplicaServer,
  ReplicaServerOpts,
} from "../mod.ts";
import { Earthstar } from "../deps.ts";
import { ReplicaDriverSqlite } from "https://deno.land/x/earthstar@v9.3.2/src/replica/replica-driver-sqlite.deno.ts";

/** A ready-made replica server with a share allow list, able to serve the contents of a single share via HTTP requests. Great for building wikis, websites, and image galleries with friends.
 * - It will look for the allow list at `./allow_list.json`
 * - Websocket sync endpoint is at `<hostname>/earthstar-api/v2`
 */
export class ShowcaseServer {
  private server: ReplicaServer;

  constructor(
    serveOpts: ExtensionServeContentOpts,
    opts: ReplicaServerOpts,
  ) {
    this.server = new ReplicaServer([
      new ExtensionShareAllowListJson({
        allowListPath: "./allow_list.json",
        onCreateReplica: (shareAddress) => {
          return new Earthstar.Replica(
            shareAddress,
            Earthstar.FormatValidatorEs4,
            new ReplicaDriverSqlite({
              share: shareAddress,
              filename: `./data/${shareAddress}.sql`,
              mode: "create-or-open",
            }),
          );
        },
      }),
      new ExtensionSyncWebsocket({
        path: "/earthstar-api/v2",
      }),
      new ExtensionServeContent(serveOpts),
    ], opts);
  }

  close() {
    return this.server.close();
  }
}
