import { Earthstar } from "../../deps.ts";
import { IReplicaServerExtension } from "./extension.ts";

interface ExtensionServerSettingsOpts {
  configurationShare: Earthstar.ShareAddress;
  onCreateReplica: (
    configurationShareAddress: string,
  ) => Earthstar.MultiformatReplica;
}

const HOSTED_SHARE_TEMPLATE =
  `/server-settings/1.*/shares/{shareAddress}/{hostType}`;

export class ExtensionServerSettings implements IReplicaServerExtension {
  private configReplica: Earthstar.MultiformatReplica;
  private onCreateReplica: (
    configurationShareAddress: string,
  ) => Earthstar.Replica;

  constructor(opts: ExtensionServerSettingsOpts) {
    this.configReplica = opts.onCreateReplica(opts.configurationShare);
    this.onCreateReplica = opts.onCreateReplica;
  }

  register(peer: Earthstar.Peer): Promise<void> {
    peer.addReplica(this.configReplica);

    const onCreateReplica = this.onCreateReplica;

    const { glob } = Earthstar.parseTemplate(HOSTED_SHARE_TEMPLATE);
    const { query, regex } = Earthstar.globToQueryAndRegex(glob);

    const configShareAddress = this.configReplica.share

    this.configReplica.getQueryStream(query, "everything").pipeTo(
      new WritableStream({
        async write(event) {
          if (event.kind === "existing" || event.kind === "success") {
            
            
            if (
              regex != null &&
              new RegExp(regex).test(event.doc.path)
            ) {
              const pathVariables = Earthstar.extractTemplateVariablesFromPath(
                HOSTED_SHARE_TEMPLATE,
                event.doc.path,
              );

              if (!pathVariables) {
                return;
              }

              const shareAddress = pathVariables["shareAddress"];
              
              if (shareAddress === configShareAddress) {
                return
              }

              if (event.doc.text.length > 0) {
                // Add
                
                
                const replica = onCreateReplica(shareAddress);


                peer.addReplica(replica);

                console.log("Server settings:", `now hosting ${replica.share}`);
              } else {
                // Remove
                const replicaToClose = peer.getReplica(shareAddress);

                if (replicaToClose) {
                  await replicaToClose.close(true);
                  peer.removeReplica(replicaToClose);
                  console.log(
                    "Server settings:",
                    `stopped hosting ${replicaToClose.share}`,
                  );
                }
              }
            }
          }

          if (event.kind === "expire") {
            if (
              regex != null &&
              new RegExp(regex).test(event.doc.path)
            ) {
              // Remove
              const pathVariables = Earthstar.extractTemplateVariablesFromPath(
                HOSTED_SHARE_TEMPLATE,
                event.doc.path,
              );

              if (!pathVariables) {
                return;
              }

              const shareAddress = pathVariables["shareAddress"];

              const replicaToClose = peer.getReplica(shareAddress);

              if (replicaToClose) {
                await replicaToClose.close(true);
                peer.removeReplica(replicaToClose);
                console.log(
                  "Server settings:",
                  `stopped hosting ${replicaToClose.share}`,
                );
              }
            }
          }
        },
      }),
    );

    return Promise.resolve();
  }

  handler(_req: Request): Promise<Response | null> {
    return Promise.resolve(null);
  }
}
