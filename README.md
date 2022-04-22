# Earthstar Replica Server

A replica server is an always-online peer which you can use to synchronise your
Earthstar shares with far away friends. They're undiscoverable and only
synchronise with peers who already know your shares' addresses.

Being regular servers on the internet, they can be extended to provide other
services too!

This module offers a selection of pre-configured replica servers, as well as a
framework for constructing your own using a variety of extensions. You can even
create your own extensions!

# Preconfigured servers

This module exports a few preconfigured servers you can deploy right away.

- **Glitch**: Share allowlist, HTTP sync, works on Node.
- **Showcase**: Share allowlist, HTTP/Websocket sync, able to serve content from
  one share through the browser.
- **Heritage**: Share allowlist, Websocket sync, Classic Earthstar (pre-v7) sync
  via HTTP.
- **Zippy**: Share allowlist, Websocket sync.
- **Nimble**: Share allowlist, HTTP sync.

Here's an example of starting one of these on Deno:

```ts
import { ZippyServer } from "https://deno.land/xxxxxxxxx/mod.ts";

const server = new ZippyServer();
// That's it. Your replica server is running.
```

If none of these configurations meets your needs, we've done our best to make it
as straightforward to configure it to your liking using extensions.

## Extensions

It's possible to configure your own replica server using extensions.

Here's a replica server with websocket sync and an allow list which creates
in-memory replicas:

```ts
import * as Earthstar from "https://deno.land/x/earthstar/mod.ts";
import {
  ExtensionShareAllowListJson,
  ExtensionSyncWebsocket,
  ReplicaServer,
} from "https://deno.land/xxxxxxx/mod.ts";

const server = new ReplicaServer([
  new ExtensionShareAllowListJson({
    allowList: "allow_list.json",
    onCreateReplica: (shareAddress) => {
      return new Earthstar.Replica(
        shareAddress,
        Earthstar.FormatValidatorEs4,
        new Earthstar.ReplicaDriverMemory(shareAddress),
      );
    },
  }),
  new ExtensionSyncWebsocket(),
]);
```

The order in which you specify extensions matters, as some extensions may do
something which another extension depends upon, e.g.
`ExtensionShareAllowListJson` sets up replicas which `ExtensionServeContent`
will serve content from.

Equally, requests will fall through extensions, returning on the first match. So
sync extensions like `ExtensionSyncHttp` should come before
`ExtensionServeContent`, so that requests to sync aren't swallowed.

### ExtensionShareAllowListJson

This extension configures which shares your replica server is allowed to
synchronise. This protects your replica server from syncing untrusted data from
strangers. The allow list is pulled from a JSON file on disk, and you can
specify how the extension should create corresponding replicas for the shares.

### ExtensionSyncWebsocket

Makes it possible for Earthstar peers to sync with your replica server using a
Websocket connection.

### ExtensionSyncHttp

Makes it possible for Earthstar peers to sync with your replica server over
HTTP.

### ExtensionSyncClassic

Makes it possible for pre-v7 Earthstar peers to sync with your replica server
over HTTP. Handy if you want to migrate data stored in older clients / pubs.

### ExtensionServeContent

Turn your replica server into a wiki, website, image gallery, or anything a web
server could do! This extension will translate requests to the server to
documents of a share of your choice, so a request for
`https://my.server/posts/page.html` will make this extension fetch `/page.html`
from a replica, and serve it back in the response! It'll do the same with
markdown, text, images, and more.

## Developing extensions

Extensions can be very simple or complex. `ExtensionShareAllowListJson` is less
than 50 lines of code.

Your extension needs to implement the interface IReplicaServerExtension, which
has two methods:

- `register`: This will be called once when the replica server is initialised.
  This is where your extension will get access to the replica server's `Peer`
  instance.
- `handler`: This is called whenever a request is made to the replica server,
  and can be optionally handled by your extension if it does something with
  server requests (e.g. syncing, serving web content). If it doesn't, you can
  return `Promise<null>`, which will pass the request on to the next extension.

You can use your extension's constructor as a place for configuring the
extension before it's registered.

Here's a simple extension which would display a message showing the number of
shares when a user would make a request to `/share-count`:

```ts
class ShareCounterExtension implements IReplicaServerExtension {
  private greeting: string;
  private peer: Earthstar.Peer;

  constructor(greeting: string) {
    // Set the user's greeting to a private variable.
    this.greeting = greeting;
  }

  register(peer: Earthstar.Peer) {
    // Set the replica server's peer to a private variable.
    this.peer = peer;

    // We could also do other stuff here, like start a new process in the background.
  }

  request(req: Request) {
    const url = new URL(req.url);

    // Check if the request is for `/share-count`
    if (url.pathname === "/share-count") {
      const shareCount = this.peer.replicas.length;

      // Serve up the greeting along with the number of shares on the replica server.
      return new Response(
        `${this.greeting}. This replica server is serving ${shareCount} shares!`,
      );
    }

    // Or pass the request on to the next extension.
    return Promise.resolve<null>;
  }
}
```

## Deploying

- Remix with Glitch
- Instructions for Fly + Dockerfile
- Running off your own machine
