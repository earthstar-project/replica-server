import {
  ExtensionServeContent,
  ExtensionShareAllowListJson,
  ExtensionSyncWebsocket,
  ReplicaServer,
  ReplicaServerOpts,
} from "../mod.ts";
import { Earthstar } from "../deps.ts";
import { ReplicaDriverSqlite } from "https://deno.land/x/earthstar@v9.3.2/src/replica/replica-driver-sqlite.deno.ts";

/** A replica server with a share allow list, and able to serve the contents of a single share via HTTP requests. */
export class ShowcaseServer {
  private server: ReplicaServer;

  constructor(sourceShare: Earthstar.ShareAddress, opts: ReplicaServerOpts) {
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
      new ExtensionSyncWebsocket({}),
      new ExtensionServeContent({
        path: "/",
        sourceShare,
      }),
    ], opts);
  }

  close() {
    return this.server.close();
  }
}
