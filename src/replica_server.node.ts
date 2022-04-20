import { createServer } from "https://deno.land/std@0.135.0/node/http.ts";
import { IReplicaServerExtension } from "./extensions/extension.ts";
import { Buffer } from "https://deno.land/std@0.135.0/node/buffer.ts";
import { ReplicaServerCore } from "./replica_server_core.ts";

export type ReplicaServerOpts = {
  port?: number;
};

/**
 * An extensible replica server able to synchronise with other peers.
 *
 * A replica server's functionality can be extended using extensions of type `IReplicaServerExtension`.
 */
export class ReplicaServer {
  private core: ReplicaServerCore;
  private server: ReturnType<typeof createServer>;

  /**
   * Create a new replica server with an array of extensions.
   * @param extensions - The extensions used by the replica server. Extensions will be registered in the order you provide them in, as one extension may depend on the actions of another. For example, the `ExtensionServeContent` may rely on a replica created by `ExtensionShareAllowListJson`.
   */
  constructor(extensions: IReplicaServerExtension[], opts?: ReplicaServerOpts) {
    this.core = new ReplicaServerCore(extensions);
    this.server = createServer(async (req, res) => {
      let data = undefined;

      if (req.method === "POST") {
        const buffers = [];

        for await (const chunk of req) {
          buffers.push(chunk);
        }

        data = Buffer.concat(buffers).toString();
      }

      const headers = new Headers();

      for (const key in req.headers) {
        if (req.headers[key]) headers.append(key, req.headers[key] as string);
      }

      // Need the hostname here so the URL plays nice with Node's URL class.
      const url = `http://0.0.0.0/${req.url}`;

      const request = new Request(url, {
        method: req.method,
        headers,
        body: data,
      });

      const response = await this.core.handler(request);

      // Headers
      for (const [key, value] of response.headers) {
        res.setHeader(key, value);
      }

      // Status
      res.statusCode = response.status;

      // Body
      // TODO: Handle streaming responses.
      if (response.body) {
        res.end(response.body);
      }

      res.end();
    });

    this.server.listen(opts?.port);
  }

  close() {
    this.server.close();
  }
}
