import * as Earthstar from "https://deno.land/x/earthstar@v7.1.0/mod.ts";
import * as Rpc from "https://deno.land/x/earthstar_streaming_rpc@3.2.3/mod.ts";
import allowList from "../allow_list.json" assert { type: "json" };
import classicHandler from "./classic-handler.ts";

const peer = new Earthstar.Peer();

const serverSyncer = new Earthstar.Syncer(
  peer,
  (methods) =>
    new Rpc.TransportWebsocketServer({
      deviceId: peer.peerId,
      methods,
      url: "",
    }),
);

for (const allowedAddress of allowList) {
  // TODO: Replace with Sqlite storage once merged.
  const storage = new Earthstar.Replica(
    allowedAddress,
    Earthstar.FormatValidatorEs4,
    new Earthstar.ReplicaDriverSqlite({
      filename: `./data/${allowedAddress}.sql`,
      mode: "create-or-open",
      share: allowedAddress,
    }),
  );

  peer.addReplica(storage);
}

export default function handler(req: Request): Promise<Response> {
  const reqUrl = new URL(req.url);

  if (reqUrl.pathname.startsWith("/earthstar-api/v1/")) {
    return classicHandler(req, peer);
  }

  return serverSyncer.transport.reqHandler(req);
}
