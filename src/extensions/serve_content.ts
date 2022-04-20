import { Earthstar } from "../../deps.ts";
import { IReplicaServerExtension } from "./extension.ts";
import { decode } from "https://deno.land/std@0.126.0/encoding/base64.ts";

interface ExtensionServeContentOpts {
  path?: string;
  sourceShare: string;
}

export class ExtensionServeContent implements IReplicaServerExtension {
  private peer: Earthstar.Peer | null = null;
  private path = "/";
  private replica: Earthstar.IReplica | null = null;
  private sourceShare: string;

  constructor(opts: ExtensionServeContentOpts) {
    if (opts.path) {
      this.path = opts.path;
    }

    this.sourceShare = opts.sourceShare;
  }

  register(peer: Earthstar.Peer) {
    this.peer = peer;

    const replica = this.peer.getReplica(this.sourceShare);

    if (!replica) {
      throw new Error(
        `No replica belonging to share ${this.sourceShare} was found!`,
      );
    }

    this.replica = replica;

    return Promise.resolve();
  }

  async handler(
    req: Request,
  ): Promise<Response | null> {
    const pathPattern = new URLPattern({
      pathname: `${this.path}*`,
    });

    const pathPatternResult = pathPattern.exec(req.url);

    if (this.replica && pathPatternResult && req.method === "GET") {
      const pathToGet = pathPatternResult.pathname.groups[0];

      const maybeDocument = await this.replica.getLatestDocAtPath(pathToGet);

      if (!maybeDocument) {
        return new Response("Not found", {
          headers: {
            status: "404",
          },
        });
      }

      return new Response(
        contentToUInt8Array(maybeDocument.path, maybeDocument.content),
        {
          headers: {
            status: "200",
            "content-type": getContentType(maybeDocument.path),
            "access-control-allow-origin": "https://gwil.garden, localhost",
          },
        },
      );
    }

    return Promise.resolve(null);
  }
}

const textEncoder = new TextEncoder();

const base64Extensions = ["jpg", "jpeg", "png", "gif", "svg"];

function contentToUInt8Array(path: string, content: string) {
  const extension = path.split(".").pop();

  if (extension && base64Extensions.includes(extension)) {
    return decode(content);
  }

  return textEncoder.encode(content);
}

function getContentType(path: string): string {
  const extension = path.split(".").pop();

  switch (extension) {
    case "js":
      return "application/javascript; charset=UTF-8";
    case "json":
      return "application/json; charset=UTF-8";
    case "html":
      return "text/html; charset=UTF-8";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "txt":
      return "text/plain; charset=UTF-8";
    case "svg":
      return "image/svg+xml";

    default:
      return "text/html; charset=utf-8";
  }
}
