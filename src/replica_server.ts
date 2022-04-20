import { serve } from "https://deno.land/std@0.129.0/http/server.ts";
import { IReplicaServerExtension } from "./extensions/extension.ts";
import { ReplicaServerCore } from "./replica_server_core.ts";

export type ReplicaServerOpts = {
  port?: number;
  hostname?: string;
};

/**
 * An extensible replica server able to synchronise with other peers.
 *
 * A replica server's functionality can be extended using extensions of type `IReplicaServerExtension`.
 */
export class ReplicaServer {
  private core: ReplicaServerCore;
  private abortController: AbortController;
  private server: Promise<void>;

  /**
   * Create a new replica server with an array of extensions.
   * @param extensions - The extensions used by the replica server. Extensions will be registered in the order you provide them in, as one extension may depend on the actions of another. For example, the `ExtensionServeContent` may rely on a replica created by `ExtensionShareAllowListJson`.
   */
  constructor(extensions: IReplicaServerExtension[], opts?: ReplicaServerOpts) {
    this.core = new ReplicaServerCore(extensions);

    this.abortController = new AbortController();

    this.server = serve(this.core.handler.bind(this.core), {
      port: opts?.port,
      hostname: opts?.hostname,
      signal: this.abortController.signal,
    });
  }

  async close() {
    this.abortController.abort();

    await this.server;
  }
}
