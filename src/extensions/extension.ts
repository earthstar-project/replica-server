import { Earthstar } from "../../deps.ts";

export interface IReplicaServerExtension {
  register(peer: Earthstar.Peer): Promise<void>;
  handler(req: Request): Promise<Response | null>;
}
