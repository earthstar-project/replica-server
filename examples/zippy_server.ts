import { parse } from "https://deno.land/std@0.119.0/flags/mod.ts";
import { ZippyServer } from "../mod.ts";

const flags = parse(Deno.args, {
  string: ["port", "hostname"],
  default: {
    port: 8080,
    hostname: "0.0.0.0",
  },
});

console.log(`Started Zippy server on ${flags.hostname}:${flags.port}`);

const server = new ZippyServer({
  hostname: flags.hostname,
  port: flags.port,
});
