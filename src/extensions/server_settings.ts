import { Earthstar } from "../../deps.ts";
import { IReplicaServerExtension } from "./extension.ts";
import { ServerSettings } from "../../../earthstar_layers/mod.ts";

interface ExtensionServerSettingsOpts {
  configurationShare: Earthstar.ShareAddress;
  onCreateReplica: (
    configurationShareAddress: string,
  ) => Earthstar.MultiformatReplica;
}

export class ExtensionServerSettings implements IReplicaServerExtension {
  private configReplica: Earthstar.MultiformatReplica;
  private onCreateReplica: (
    configurationShareAddress: string,
  ) => Earthstar.MultiformatReplica;

  constructor(opts: ExtensionServerSettingsOpts) {
    this.configReplica = opts.onCreateReplica(opts.configurationShare);
    this.onCreateReplica = opts.onCreateReplica;
  }

  async register(peer: Earthstar.Peer): Promise<void> {
    peer.addReplica(this.configReplica);

    // Get shares configured by settings.
    const hostedShares = await ServerSettings.getHostedShares(
      this.configReplica,
    );

    // Add them to the server peer.
    for (const share of hostedShares) {
      const replica = this.onCreateReplica(share);
      peer.addReplica(replica);
    }

    // Listen for expiring documents and remove them.
    this.configReplica.onEvent((event) => {
      if (event.kind === "expire") {
        // Check if it's a hosted share doc.
        const variables = Earthstar.extractTemplateVariablesFromPath(
          ServerSettings.TEMPORARY_HOSTED_SHARE_TEMPLATE,
          event.doc.path,
        );

        if (variables && variables["shareName"]) {
          // If so, remove from the server peer.
          peer.removeReplicaByShare(variables["shareName"]);
        }
      }
    });
  }

  handler(_req: Request): Promise<Response | null> {
    return Promise.resolve(null);
  }
}
