import { Earthstar } from "../../deps.ts";
import { IReplicaServerExtension } from "./extension.ts";

/**
 * - `knownSharesPath`: The path where the known shares (a JSON array of share addresses) is located.
 * - `onCreateReplica`: A callback used to create the replicas in the known shares list. Mostly useful for choosing how you'd like your shares to be persisted, e.g. probably by Sqlite.
 */
interface ExtensionKnownSharesOpts {
  knownSharesPath: string;
  onCreateReplica: (shareAddress: string) => Earthstar.IReplica;
}

/** An extension for populating a replica server with known shares. Use this to specify which shares you'd like your replica server to sync with others.
 *
 * You most likely want to pass this as the first extension to your replica server.
 */
export class ExtensionKnownShares implements IReplicaServerExtension {
  private peer: Earthstar.Peer | null = null;
  private knownSharesPath: string;
  private onCreateReplica: (shareAddress: string) => Earthstar.IReplica;

  constructor(opts: ExtensionKnownSharesOpts) {
    this.knownSharesPath = opts.knownSharesPath;
    this.onCreateReplica = opts.onCreateReplica;
  }

  async register(peer: Earthstar.Peer) {
    this.peer = peer;

    const knownSharesRaw = await Deno.readTextFile(this.knownSharesPath);

    const knownShares = JSON.parse(knownSharesRaw) as string[];

    for (const shareAddress of knownShares) {
      const replica = this.onCreateReplica(shareAddress);
      await this.peer.addReplica(replica);
    }
  }

  handler() {
    return Promise.resolve(null);
  }
}
