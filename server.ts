import { serve } from "https://deno.land/std@0.125.0/http/server.ts";
import { parse } from "https://deno.land/std@0.119.0/flags/mod.ts";
import handler from "./src/handler.ts";

const flags = parse(Deno.args, {
  string: ["port", "hostname"],
  default: { port: "8080", hostname: "0.0.0.0" },
});

console.log(`Started server on ${flags.hostname}:${flags.port}`);

await serve(handler, {
  port: parseInt(flags.port),
  hostname: flags.hostname,
});
