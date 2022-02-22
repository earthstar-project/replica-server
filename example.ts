import * as Earthstar from "../stone-soup/mod.ts";
import * as EarthstarClassic from "https://esm.sh/earthstar?dts";
import { serve } from "https://deno.land/std@0.125.0/http/server.ts";
import handler from "./src/handler.ts";
import allowList from "./allow_list.json" assert { type: "json" };

const keypairA = await Earthstar.Crypto.generateAuthorKeypair(
  "suzy",
) as Earthstar.AuthorKeypair;
const keypairB = await Earthstar.Crypto.generateAuthorKeypair(
  "fred",
) as Earthstar.AuthorKeypair;

// Create peers
const peer = new Earthstar.Peer();
const peer2 = new Earthstar.Peer();

console.group("Setting up peers...");
for (const allowedAddress of allowList) {
  console.group(`Setting up ${allowedAddress}...`);

  const storage = new Earthstar.StorageAsync(
    allowedAddress,
    Earthstar.FormatValidatorEs4,
    new Earthstar.StorageDriverAsyncMemory(allowedAddress),
  );

  const storage2 = new Earthstar.StorageAsync(
    allowedAddress,
    Earthstar.FormatValidatorEs4,
    new Earthstar.StorageDriverAsyncMemory(allowedAddress),
  );

  peer.addStorage(storage);
  peer2.addStorage(storage2);

  console.log(`Added to local peers.`);

  storage.set(keypairA, {
    content: "From New Storage 1!",
    format: "es.4",
    path: "/new/1.txt",
  });

  storage2.set(keypairB, {
    content: "From New Storage 2!",
    format: "es.4",
    path: "/new/2.txt",
  });

  console.log(`Added some sample docs.`);

  const qf1 = new Earthstar.QueryFollower(storage, {
    historyMode: "all",
    orderBy: "localIndex ASC",
  });
  const qf2 = new Earthstar.QueryFollower(storage2, {
    historyMode: "all",
    orderBy: "localIndex ASC",
  });

  qf1.bus.on((data) => {
    if (data.kind === "success") {
      console.group(`%c${allowedAddress} 1 got doc:`, "color: purple");
      console.log(data.doc.path);
      console.log(data.doc.content);
      console.groupEnd();
    }
  });

  qf2.bus.on((data) => {
    if (data.kind === "success") {
      console.group(`%c${allowedAddress} 2 got doc:`, "color: purple");
      console.log(data.doc.path);
      console.log(data.doc.content);
      console.groupEnd();
    }
  });

  await qf1.hatch();
  await qf2.hatch();

  console.log("Set up query followers.");
  console.groupEnd();
}
console.groupEnd();

//

console.group("Setting up classic storages...");
const classicStorages: EarthstarClassic.StorageMemory[] = [];
for (const allowedAddress of allowList) {
  console.group(`Setting up ${allowedAddress}...`);
  const storage = new EarthstarClassic.StorageMemory([
    EarthstarClassic.ValidatorEs4,
  ], allowedAddress);
  const storage2 = new EarthstarClassic.StorageMemory([
    EarthstarClassic.ValidatorEs4,
  ], allowedAddress);

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
      console.group(`%c${allowedAddress} (Classic) got doc:`, "color: purple");
      console.log(event.document.path);
      console.log(event.document.content);
      console.groupEnd();
    }
  });

  storage2.onWrite.subscribe((event) => {
    if (event.kind === "DOCUMENT_WRITE") {
      console.group(
        `%c${allowedAddress} 2 (Classic) got doc:`,
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

const server = serve(handler, {
  port: 9091,
});

console.log(`%cStarted server.`, "color: green");

peer.sync("ws://localhost:9091/earthstar-api/v2");
peer2.sync("ws://localhost:9091/earthstar-api/v2");

console.log("%cBegan syncing peers...", "color: green");

for (const storage of classicStorages) {
  const syncer = new EarthstarClassic.Syncer1(storage);
  syncer.addPub("http://localhost:9091");

  setInterval(() => syncer.sync(), 1000);
}

console.log("%cBegan syncing classic peers...", "color: green");

function checkAllAreSynced() {
  const allStoragesSynced = peer.storages().every(async (storage) => {
    const docs = await storage.getLatestDocs();
    return docs.length === 4;
  });

  const allStoragesSynced2 = peer2.storages().every(async (storage) => {
    const docs = await storage.getLatestDocs();
    return docs.length === 4;
  });

  const allClassicStoragesSynced = classicStorages.every((storage) => {
    return storage.documents().length === 4;
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
