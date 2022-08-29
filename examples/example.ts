import { Earthstar } from "../deps.ts";
import sharesList from "../known_shares.json" assert { type: "json" };
import { NimbleServer } from "../mod.ts";

const keypairA = await Earthstar.Crypto.generateAuthorKeypair(
  "suzy",
) as Earthstar.AuthorKeypair;
const keypairB = await Earthstar.Crypto.generateAuthorKeypair(
  "lani",
) as Earthstar.AuthorKeypair;

// Create peers
const peer = new Earthstar.Peer();
const peer2 = new Earthstar.Peer();

const bytes = new TextEncoder().encode("yooo!");

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

  await storage.set(keypairA, {
    text: "From New Storage 1!",
    path: "/new/1",
  });

  const attachDoc = await storage.set(keypairA, {
    text: "From New Storage 1!",
    path: "/new/one.txt",
    attachment: bytes,
  });

  console.log(attachDoc);

  await storage2.set(keypairB, {
    text: "From New Storage 2!",
    path: "/new/2",
  });

  console.log(`Added some sample docs.`);

  const qs1 = storage.getQueryStream({
    historyMode: "all",
    orderBy: "localIndex ASC",
  }, "everything");

  const qs2 = storage.getQueryStream({
    historyMode: "all",
    orderBy: "localIndex ASC",
  }, "everything");

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

// Let's sync!

//const server = new NimbleServer({ port: 9091 });

console.log(`%cStarted server.`, "color: green");

peer.sync("ws://localhost:9091");
peer2.sync("ws://localhost:9091");

console.log("%cBegan syncing peers...", "color: green");

const replicas = peer.replicas();

await new Promise((resolve) => {
  setTimeout(resolve, 1000);
});

for (const replica of replicas) {
  await replica.set(keypairA, {
    text: "Test",
    path: "/after",
  });
}

async function checkAllAreSynced() {
  const allStoragesSynced = peer.replicas().every(async (storage) => {
    const docs = await storage.getLatestDocs();
    return docs.length === 5;
  });

  const allStoragesSynced2 = peer2.replicas().every(async (storage) => {
    const docs = await storage.getLatestDocs();
    return docs.length === 5;
  });

  if (allStoragesSynced && allStoragesSynced2) {
    console.log("%cEverything was synced up!", "background-color: green");

    await Deno.remove("./data", { recursive: true });
    await Deno.mkdir("./data");

    Deno.exit(0);
  } else {
    console.group(
      "%cNot synced up yet...",
      "background-color: orange",
    );
    console.log({
      allStoragesSynced,
      allStoragesSynced2,
    });
    console.groupEnd();
  }
}

setInterval(checkAllAreSynced, 2000);

await server;
