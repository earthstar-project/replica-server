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

If none of these configuration _quite_ meets your needs, it's easy to roll your
own using extensions.

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
  new ExtensionSyncWebsocket(),
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
]);
```

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

## Deploying

- Remix with Glitch
- Instructions for Fly + Dockerfile
- Running off your own machine
