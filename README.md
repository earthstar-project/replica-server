# Earthstar Replica Server

A replica server is an always-online peer which you can use to synchronise your
shares with far away friends. They're undiscoverable and only synchronise with
peers who already know your shares' addresses.

Putting one of these online requires a bit of technical know-how, as you will
need to know how to run the server and optionally publicly expose it to the web.
If that sounds a bit complicated, find a member of your share who likes this
kind of thing.

This implementation supports synchronising with Earthstar and Earthstar Classic
(< v.7.0.0) peers.

This replica server _will only synchronise explicitly allowed shares_,
configurable via an allowlist.

## Configuring the allow list

Create a file called `allow_list.json` in the root of this project. Define an
array of allowed share addresses inside:

```json
[
  "+welcome.a123",
  "+croissants.b234",
  "+potential.c345"
]
```

## Running locally from source

To run this locally from source, you'll need to
[install Deno](https://deno.land/#installation).

To check that everything works:

```
make example
```

This should print out a series of messages, with the last one being a nice green
'Everything synced up!'.

To run the server:

```
deno run --allow-net --allow-env server.ts
```

You can configure the port and hostname with flags:

```
deno run --allow-net --allow-env server.ts --port=7070 --hostname=192.168.0.0
```
