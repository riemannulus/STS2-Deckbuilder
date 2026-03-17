import { createYoga, createSchema } from "graphql-yoga";
import { typeDefs } from "./src/server/graphql/schema";
import { resolvers } from "./src/server/graphql/resolvers";
import index from "./src/client/index.html";

const yoga = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  graphqlEndpoint: "/graphql",
  graphiql: true,
});

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
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/images/")) {
      const filePath = `public${url.pathname}`;
      const file = Bun.file(filePath);
      return file.exists().then((exists) => {
        if (exists) return new Response(file);
        return new Response("Not found", { status: 404 });
      });
    }
    return new Response("Not found", { status: 404 });
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log("STS2 Deck Builder running at http://localhost:3000");
console.log("GraphQL Playground at http://localhost:3000/graphql");
