.PHONY: server example

server:
	deno run --allow-net --allow-env --allow-read --allow-write --no-check server.ts

bin:
	deno compile --allow-all server.ts

example:
	deno run --allow-all --no-check example.ts