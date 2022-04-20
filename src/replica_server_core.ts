import { Earthstar } from "../deps.ts";
import { IReplicaServerExtension } from "./extensions/extension.ts";

export class ReplicaServerCore {
  private extensions: IReplicaServerExtension[];
  private peer: Earthstar.Peer;
  private isReady: Promise<void>;

  /**
   * Create a new replica server with an array of extensions.
   * @param extensions - The extensions used by the replica server. Extensions will be registered in the order you provide them in, as one extension may depend on the actions of another. For example, the `ExtensionServeContent` may rely on a replica created by `ExtensionShareAllowListJson`.
   */
  constructor(extensions: IReplicaServerExtension[]) {
    const peer = new Earthstar.Peer();
    this.peer = peer;
    this.extensions = extensions;

    this.isReady = this.registerExtensions();

    console.log("Your replica server is running.");
  }

  private async registerExtensions() {
    // Extensions must be registered sequentially, one-by-one,
    // As later extensions may depend on the actions of previous ones
    // e.g. The serve content extension using a share added by the allow list extension
    for (const extension of this.extensions) {
      await extension.register(this.peer);
    }
  }

  async handler(req: Request): Promise<Response> {
    await this.isReady;

    for (const extension of this.extensions) {
      const response = await extension.handler(req);

      if (response) {
        return response;
      }
    }

    return new Response("Not found", { status: 404 });
  }
}
