import * as Earthstar from "../../stone-soup/mod.ts";
import * as Rpc from "../../earthstar-streaming-rpc/mod.ts";
import allowList from "../allow_list.json" assert { type: "json" };
import classicHandler from "./classic-handler.ts";

const peer = new Earthstar.Peer();

// TODO: Replace with websocket server when that's merged.
const serverSyncer = new Earthstar.Syncer(
  peer,
  (methods) =>
    new Rpc.TransportHttpServer({
      path: "/earthstar-api/v2/",
      deviceId: peer.peerId,
      methods,
    }),
);

for (const allowedAddress of allowList) {
  // TODO: Replace with Sqlite storage once merged.
  const storage = new Earthstar.StorageAsync(
    allowedAddress,
    Earthstar.FormatValidatorEs4,
    new Earthstar.StorageDriverAsyncMemory(allowedAddress),
  );

  peer.addStorage(storage);
}

export default function handler(req: Request): Promise<Response> {
  const reqUrl = new URL(req.url);

  if (reqUrl.pathname.startsWith("/earthstar-api/v1/")) {
    return classicHandler(req, peer);
  }

  return serverSyncer.transport.handler(req);
}
