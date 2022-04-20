import {
  ExtensionShareAllowListJson,
  ExtensionSyncClassic,
  ExtensionSyncWebsocket,
  ReplicaServer,
  ReplicaServerOpts,
} from "../mod.ts";
import { Earthstar } from "../deps.ts";
import { ReplicaDriverSqlite } from "https://deno.land/x/earthstar@v9.3.2/src/replica/replica-driver-sqlite.deno.ts";

/** A replica server with a share allow list, able to synchronise with both classic (<v7) peers via HTTP as well as newer peers using websockets. */
export class HeritageServer {
  private server: ReplicaServer;

  constructor(opts: ReplicaServerOpts) {
    this.server = new ReplicaServer(
      [
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
        new ExtensionSyncClassic({}),
      ],
      opts,
    );
  }

  close() {
    return this.server.close();
  }
}
