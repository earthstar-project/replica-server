import {
  ExtensionKnownShares,
  ExtensionSyncWebsocket,
  ReplicaServer,
  ReplicaServerOpts,
} from "../mod.ts";
import { Earthstar } from "../deps.ts";
import { ReplicaDriverSqlite } from "https://deno.land/x/earthstar@v9.3.2/src/replica/replica-driver-sqlite.deno.ts";

/** A ready-made replica server populated with shares from a local list, and Websocket syncing.
 * - It will look for the known shares list at `./known_shares.json`
 * - Websocket sync endpoint is at `<hostname>/earthstar-api/v2`
 */
export class NimbleServer {
  private server: ReplicaServer;

  constructor(opts: ReplicaServerOpts) {
    this.server = new ReplicaServer([
      new ExtensionKnownShares({
        knownSharesPath: "./known_shares.json",
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
    ], opts);
  }

  close() {
    return this.server.close();
  }
}
