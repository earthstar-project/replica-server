import { Earthstar } from "../../deps.ts";
import { IReplicaServerExtension } from "./extension.ts";

interface ExtensionShareAllowListJsonOpts {
  allowListPath: string;
  onCreateReplica: (shareAddress: string) => Earthstar.IReplica;
}

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
