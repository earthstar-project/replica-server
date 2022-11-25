import {
  ExtensionKnownShares,
  ExtensionSyncWeb,
  ReplicaServer,
  ReplicaServerOpts,
} from "../mod.ts";
import { Earthstar } from "../deps.ts";
import { ExtensionServerSettings } from "../src/extensions/server_settings.ts";

/** A ready-made replica server populated with shares from a local list, and Websocket syncing.
 * - It will look for the known shares list at `./known_shares.json`
 * - Websocket sync endpoint is at `<hostname>/earthstar-api/v2`
 */
export class NimbleServer {
  private server: ReplicaServer;

  constructor(opts: ReplicaServerOpts) {
    this.server = new ReplicaServer([
      new ExtensionServerSettings({
        configurationShare:
          "+apples.btqswluholq6on2ci5mck66uzkmumb5uszgvqimtshff2f6zy5etq",
        onCreateReplica: (shareAddress) => {
          return new Earthstar.Replica(
            {
              driver: {
                docDriver: new Earthstar.DocDriverSqlite({
                  share: shareAddress,
                  filename: `./data/${shareAddress}.sql`,
                  mode: "create-or-open",
                }),
                attachmentDriver: new Earthstar.AttachmentDriverFilesystem(
                  `./data/${shareAddress}_attachments`,
                ),
              },
            },
          );
        },
      }),
      new ExtensionSyncWeb({}),
    ], opts);
  }

  close() {
    return this.server.close();
  }
}
