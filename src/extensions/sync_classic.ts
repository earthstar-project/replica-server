import { Earthstar } from "../../deps.ts";
import { IReplicaServerExtension } from "./extension.ts";

const corsHeaders = {
  "Access-Control-Allow-Headers": "Content-Type, Access-Control-Allow-Headers",
  "Access-Control-Allow-Origin": "*",
};

/**
 * - `path`: The path at which syncing should take place. Will default to `/earthstar-api/v1/` if not given.
 */
interface ExtensionSyncClassicOpts {
  path?: string;
}

/** An extension which enables synchronisation with pre-v7 Earthstar peers. Useful if you want to migrate Earthstar data from older clients to new one, or if you just want to keep using pre-v7 Earthstar clients. */
export class ExtensionSyncClassic implements IReplicaServerExtension {
  private peer: Earthstar.Peer | null = null;
  private path = "/earthstar-api/v1/";

  constructor(opts: ExtensionSyncClassicOpts) {
    if (opts.path) {
      this.path = opts.path;
    }
  }

  register(peer: Earthstar.Peer) {
    this.peer = peer;

    return Promise.resolve();
  }

  async handler(
    req: Request,
  ): Promise<Response | null> {
    const allPathsPattern = new URLPattern({
      pathname: `${this.path}:workspace/paths `,
    });
    const allDocsPattern = new URLPattern({
      pathname: `${this.path}:workspace/documents `,
    });

    const allPathsResult = allPathsPattern.exec(req.url);
    const allDocsResult = allDocsPattern.exec(req.url);

    if (this.peer && allPathsResult && req.method === "GET") {
      const shareAddress = allPathsResult.pathname.groups["workspace"];

      const replica = this.peer.getReplica(shareAddress);

      if (!replica) {
        return new Response("Not found", {
          headers: {
            status: "404",
            ...corsHeaders,
          },
        });
      }

      const docs = await replica.getLatestDocs();
      const paths = docs.map((doc) => doc.path);

      return new Response(JSON.stringify(paths), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...corsHeaders,
        },
      });
    }

    if (this.peer && allDocsResult && req.method === "GET") {
      const shareAddress = allDocsResult.pathname.groups["workspace"];

      const replica = this.peer.getReplica(shareAddress);

      if (!replica) {
        return new Response("Not found", {
          headers: {
            status: "404",
            ...corsHeaders,
          },
        });
      }

      const docs = await replica.getAllDocs();

      return new Response(JSON.stringify(docs), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...corsHeaders,
        },
      });
    }

    if (this.peer && allDocsResult && req.method === "POST") {
      const shareAddress = allDocsResult.pathname.groups["workspace"];

      const replica = this.peer.getReplica(shareAddress);

      if (!replica) {
        return new Response("Not found", {
          headers: {
            status: "404",
            ...corsHeaders,
          },
        });
      }

      const incomingDocs = await req.json();

      if (!Array.isArray(incomingDocs)) {
        return new Response("Bad request", {
          headers: {
            status: "400",
            ...corsHeaders,
          },
        });
      }

      let numIngested = 0;
      for (const doc of incomingDocs) {
        const ingestRes = await replica.ingest(doc);

        if (!Earthstar.isErr(ingestRes)) {
          numIngested += 1;
        }
      }

      const result = {
        numIngested: numIngested,
        numIgnored: incomingDocs.length - numIngested,
        numTotal: incomingDocs.length,
      };

      return new Response(JSON.stringify(result), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          ...corsHeaders,
        },
      });
    }

    return Promise.resolve(null);
  }
}
