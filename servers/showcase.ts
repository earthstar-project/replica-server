import {
  ExtensionKnownShares,
  ExtensionServeContent,
  ExtensionServeContentOpts,
  ExtensionSyncWeb,
  ReplicaServer,
  ReplicaServerOpts,
} from "../mod.ts";
import { Earthstar } from "../deps.ts";

/** A ready-made replica server populated with shares from a local list, able to serve the contents of a single share via HTTP requests. Great for building wikis, websites, and image galleries with friends.
 * - It will look for the known shares list at `./known_shares.json`
 * - Websocket sync endpoint is at `<hostname>/earthstar-api/v2`
 */
export class ShowcaseServer {
  private server: ReplicaServer;

  constructor(
    serveOpts: ExtensionServeContentOpts,
    opts: ReplicaServerOpts,
  ) {
    this.server = new ReplicaServer([
      new ExtensionKnownShares({
        knownSharesPath: "./known_shares.json",
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
      new ExtensionSyncWeb({
        path: "/sync",
      }),
      new ExtensionServeContent(serveOpts),
    ], opts);
  }

  close() {
    return this.server.close();
  }
}
