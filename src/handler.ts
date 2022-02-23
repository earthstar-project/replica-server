import { Earthstar, Rpc } from "../deps.ts";
import classicHandler from "./classic-handler.ts";
import { parse } from "https://deno.land/std@0.119.0/flags/mod.ts";

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

const flags = parse(Deno.args, {
  string: ["allowList"],
  default: {
    allowList: "./allow_list.json",
  },
});

const allowListRaw = await Deno.readTextFile(flags.allowList);
const allowList = JSON.parse(allowListRaw) as string[];

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
