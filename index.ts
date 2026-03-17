import { createYoga, createSchema } from "graphql-yoga";
import { typeDefs } from "./src/server/graphql/schema";
import { resolvers } from "./src/server/graphql/resolvers";
import index from "./src/client/index.html";

const yoga = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  graphqlEndpoint: "/graphql",
  graphiql: true,
});

const isDev = process.env.NODE_ENV !== "production";

Bun.serve({
  port: 3000,
  routes: {
    "/": index,
    "/deck-building": index,
    "/graphql": {
      GET: (req) => yoga.handle(req),
      POST: (req) => yoga.handle(req),
      OPTIONS: (req) => yoga.handle(req),
    },
  },
  async fetch(req) {
    const url = new URL(req.url);

    // Serve static images
    if (url.pathname.startsWith("/images/")) {
      const file = Bun.file(`public${url.pathname}`);
      if (await file.exists()) return new Response(file);
    }

    // Let Bun handle /_bun/ asset paths and everything else
    return undefined as any;
  },
  development: isDev ? { hmr: true, console: true } : false,
});

console.log("STS2 Deck Builder running at http://localhost:3000");
console.log("GraphQL Playground at http://localhost:3000/graphql");
