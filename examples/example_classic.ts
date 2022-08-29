import { Earthstar } from "../deps.ts";
import * as EarthstarClassic from "https://esm.sh/earthstar?dts";
import { HeritageServer } from "../servers/heritage.ts";
import sharesList from "../known_shares.json" assert { type: "json" };

const keypairA = await Earthstar.Crypto.generateAuthorKeypair(
  "suzy",
) as Earthstar.AuthorKeypair;
const keypairB = await Earthstar.Crypto.generateAuthorKeypair(
  "lani",
) as Earthstar.AuthorKeypair;

// Create peers
const peer = new Earthstar.Peer();
const peer2 = new Earthstar.Peer();

console.group("Setting up peers...");
for (const knownShare of sharesList) {
  console.group(`Setting up ${knownShare}...`);

  const storage = new Earthstar.Replica(
    { driver: new Earthstar.ReplicaDriverMemory(knownShare) },
  );

  const storage2 = new Earthstar.Replica(
    { driver: new Earthstar.ReplicaDriverMemory(knownShare) },
  );

  peer.addReplica(storage);
  peer2.addReplica(storage2);

  console.log(`Added to local peers.`);

  storage.set(keypairA, {
    text: "From New Storage 1!",

    path: "/new/1.txt",
  });

  storage2.set(keypairB, {
    text: "From New Storage 2!",
    path: "/new/2.txt",
  });

  console.log(`Added some sample docs.`);

  const qs1 = storage.getQueryStream({
    historyMode: "all",
    orderBy: "localIndex ASC",
  });

  const qs2 = storage.getQueryStream({
    historyMode: "all",
    orderBy: "localIndex ASC",
  });

  const logWritable1 = new WritableStream<
    Earthstar.QuerySourceEvent<Earthstar.DocEs5>
  >({
    write(chunk) {
      if (chunk.kind === "success") {
        console.group(`%c${knownShare} 1 got doc:`, "color: purple");
        console.log(chunk.doc.path);
        console.log(chunk.doc.text);
        console.groupEnd();
      }
    },
  });

  const logWritable2 = new WritableStream<
    Earthstar.QuerySourceEvent<Earthstar.DocEs5>
  >({
    write(chunk) {
      if (chunk.kind === "success") {
        console.group(`%c${knownShare} 1 got doc:`, "color: blue");
        console.log(chunk.doc.path);
        console.log(chunk.doc.text);
        console.groupEnd();
      }
    },
  });

  console.log("Set up query streams.");

  qs1.pipeTo(logWritable1);
  qs2.pipeTo(logWritable2);

  console.groupEnd();
}
console.groupEnd();

//

console.group("Setting up classic storages...");
const classicStorages: EarthstarClassic.StorageMemory[] = [];
for (const knownShare of sharesList) {
  console.group(`Setting up ${knownShare}...`);
  const storage = new EarthstarClassic.StorageMemory([
    EarthstarClassic.ValidatorEs4,
  ], knownShare);
  const storage2 = new EarthstarClassic.StorageMemory([
    EarthstarClassic.ValidatorEs4,
  ], knownShare);

  storage.set(keypairA, {
    content: "From classic storage 1!",
    format: "es.4",
    path: "/classic/1.txt",
  });

  storage2.set(keypairB, {
    content: "From classic storage 2!",
    format: "es.4",
    path: "/classic/2.txt",
  });

  console.log(`Added some sample docs.`);

  classicStorages.push(storage, storage2);

  storage.onWrite.subscribe((event) => {
    if (event.kind === "DOCUMENT_WRITE") {
      console.group(`%c${knownShare} (Classic) got doc:`, "color: purple");
      console.log(event.document.path);
      console.log(event.document.content);
      console.groupEnd();
    }
  });

  storage2.onWrite.subscribe((event) => {
    if (event.kind === "DOCUMENT_WRITE") {
      console.group(
        `%c${knownShare} 2 (Classic) got doc:`,
        "color: purple",
      );
      console.log(event.document.path);
      console.log(event.document.content);
      console.groupEnd();
    }
  });

  console.log(`Subscribed to storage events.`);

  console.groupEnd();
}
console.groupEnd();

// Let's sync!

const server = new HeritageServer({ port: 9091 });

console.log(`%cStarted server.`, "color: green");

peer.sync("ws://localhost:9091");
peer2.sync("ws://localhost:9091");

console.log("%cBegan syncing peers...", "color: green");

for (const storage of classicStorages) {
  const syncer = new EarthstarClassic.Syncer1(storage);
  syncer.addPub("http://localhost:9091");

  setInterval(() => syncer.sync(), 1000);
}

console.log("%cBegan syncing classic peers...", "color: green");

const replicas = peer.replicas();

await new Promise((resolve) => {
  setTimeout(resolve, 1000);
});

for (const replica of replicas) {
  await replica.set(keypairA, {
    text: "Test",
    path: "/after.txt",
  });
}

function checkAllAreSynced() {
  const allStoragesSynced = peer.replicas().every(async (storage) => {
    const docs = await storage.getLatestDocs();
    return docs.length === 5;
  });

  const allStoragesSynced2 = peer2.replicas().every(async (storage) => {
    const docs = await storage.getLatestDocs();
    return docs.length === 5;
  });

  const allClassicStoragesSynced = classicStorages.every((storage) => {
    return storage.documents().length === 5;
  });

  if (allStoragesSynced && allStoragesSynced2 && allClassicStoragesSynced) {
    console.log("%cEverything was synced up!", "background-color: green");
    Deno.exit(0);
  } else {
    console.group(
      "%cNot synced up yet...",
      "background-color: orange",
    );
    console.log({
      allStoragesSynced,
      allStoragesSynced2,
      allClassicStoragesSynced,
    });
    console.groupEnd();
  }
}

setInterval(checkAllAreSynced, 2000);

await server;
