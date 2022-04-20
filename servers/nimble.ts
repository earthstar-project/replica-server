import {
  ExtensionShareAllowListJson,
  ExtensionSyncHttp,
  ReplicaServer,
  ReplicaServerOpts,
} from "../mod.ts";
import { Earthstar } from "../deps.ts";
import { ReplicaDriverSqlite } from "https://deno.land/x/earthstar@v9.3.2/src/replica/replica-driver-sqlite.deno.ts";

/** A ready-made replica server with a share allow list and HTTP syncing.
 * - It will look for the allow list at `./allow_list.json`
 * - HTTP sync endpoint is at `<hostname>/earthstar-api/v2`
 */
export class NimbleServer {
  private server: ReplicaServer;

  constructor(opts: ReplicaServerOpts) {
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
      new ExtensionSyncHttp({
        path: "/earthstar-api/v2",
      }),
    ], opts);
  }

  close() {
    return this.server.close();
  }
}
