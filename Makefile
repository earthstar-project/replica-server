server:
	deno run --allow-net --allow-env --no-check server.ts

bin:
	deno compile --allow-all server.ts

example:
	deno run --allow-all --no-check example.ts