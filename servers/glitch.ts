import {
  ExtensionKnownShares,
  ExtensionSyncWeb,
  ReplicaServer,
  ReplicaServerOpts,
} from "../mod.node.ts";
import { Earthstar } from "../deps.ts";

/** A ready-made replica server populated with shares from a local list, and HTTP sync.
 * - It will look for the known shares list at `./known_shares.json`
 * - The sync endpoint is at `<hostname>/earthstar-api/v2`
 */
export class GlitchServer {
  private server: ReplicaServer;

  constructor(opts: ReplicaServerOpts) {
    this.server = new ReplicaServer([
      new ExtensionKnownShares({
        knownSharesPath: ".data/known_shares.json",
        onCreateReplica: (shareAddress) => {
          return new Earthstar.Replica(
            {
              driver: {
                docDriver: new Earthstar.DocDriverSqlite({
                  share: shareAddress,
                  filename: `./data/${shareAddress}/docs.sql`,
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
      new ExtensionSyncWeb({
        path: "/earthstar-api/v2",
      }),
    ], opts);
  }

  close() {
    return this.server.close();
  }
}
