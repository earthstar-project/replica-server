import { parse } from "https://deno.land/std@0.119.0/flags/mod.ts";
import { ShowcaseServer } from "../mod.ts";

const flags = parse(Deno.args, {
  string: ["port", "hostname"],
  default: {
    port: 8080,
    hostname: "0.0.0.0",
  },
});

console.log(`Started showcase server on ${flags.hostname}:${flags.port}`);

const server = new ShowcaseServer("+welcome.a123", {
  hostname: flags.hostname,
  port: flags.port,
});
