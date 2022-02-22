import * as Earthstar from "../../earthstar/mod.ts";

export default async function classicHandler(
  req: Request,
  peer: Earthstar.Peer,
): Promise<Response> {
  const allPathsPattern = new URLPattern({
    pathname: `/earthstar-api/v1/:workspace/paths `,
  });
  const allDocsPattern = new URLPattern({
    pathname: `/earthstar-api/v1/:workspace/documents `,
  });

  const allPathsResult = allPathsPattern.exec(req.url);
  const allDocsResult = allDocsPattern.exec(req.url);

  if (allPathsResult && req.method === "GET") {
    const shareAddress = allPathsResult.pathname.groups["workspace"];

    const storage = peer.getStorage(shareAddress);

    if (!storage) {
      return new Response("Not found", {
        headers: {
          status: "404",
        },
      });
    }

    const docs = await storage.getLatestDocs();
    const paths = docs.map((doc) => doc.path);

    return new Response(JSON.stringify(paths), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }

  if (allDocsResult && req.method === "GET") {
    const shareAddress = allDocsResult.pathname.groups["workspace"];

    const storage = peer.getStorage(shareAddress);

    if (!storage) {
      return new Response("Not found", {
        headers: {
          status: "404",
        },
      });
    }

    const docs = await storage.getAllDocs();

    return new Response(JSON.stringify(docs), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }

  if (allDocsResult && req.method === "POST") {
    const shareAddress = allDocsResult.pathname.groups["workspace"];

    const storage = peer.getStorage(shareAddress);

    if (!storage) {
      return new Response("Not found", {
        headers: {
          status: "404",
        },
      });
    }

    const incomingDocs = await req.json();

    if (!Array.isArray(incomingDocs)) {
      return new Response("Bad request", {
        headers: {
          status: "400",
        },
      });
    }

    let numIngested = 0;
    for (const doc of incomingDocs) {
      const ingestRes = await storage.ingest(doc);

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
      },
    });
  }

  return new Response("Not found", {
    headers: {
      status: "404",
    },
  });
}
