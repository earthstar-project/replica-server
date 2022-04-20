import { Earthstar } from "../../deps.ts";
import { IReplicaServerExtension } from "./extension.ts";

/**
 * - `allowListPath`: The path where the allow list (a JSON array of share addresses) is located.
 * - `onCreateReplica`: A callback used to create the replicas in the allow list. Mostly useful for choosing how you'd like your shares to be persisted, e.g. probably by Sqlite.
 */
interface ExtensionShareAllowListJsonOpts {
  allowListPath: string;
  onCreateReplica: (shareAddress: string) => Earthstar.IReplica;
}

/** An extension for populating a replica server with shares from an allowlist. Use this to specify which shares you'd like your replica server to sync with others.
 *
 * You most likely want to pass this as the first extension to your replica server.
 */
export class ExtensionShareAllowListJson implements IReplicaServerExtension {
  private peer: Earthstar.Peer | null = null;
  private allowListPath: string;
  private onCreateReplica: (shareAddress: string) => Earthstar.IReplica;

  constructor(opts: ExtensionShareAllowListJsonOpts) {
    this.allowListPath = opts.allowListPath;
    this.onCreateReplica = opts.onCreateReplica;
  }

  async register(peer: Earthstar.Peer) {
    this.peer = peer;

    const allowListRaw = await Deno.readTextFile(this.allowListPath);

    const allowList = JSON.parse(allowListRaw) as string[];

    for (const allowedAddress of allowList) {
      const replica = this.onCreateReplica(allowedAddress);
      await this.peer.addReplica(replica);
    }
  }

  handler() {
    return Promise.resolve(null);
  }
}
