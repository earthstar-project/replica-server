import { Earthstar } from "../../deps.ts";

/** Implement this interface to create a replica server extension.
 *
 * - `register` is called once by the replica server, and this is where you can get a reference to its underlying `Earthstar.Peer`.
 * - `handler` is called by the replica server when it is trying to fulfil a server request. If your extension does not interact with user requests you can return `Promise.resolve(null)`.
 */
export interface IReplicaServerExtension {
  register(peer: Earthstar.Peer): Promise<void>;
  handler(req: Request): Promise<Response | null>;
}
