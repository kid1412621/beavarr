import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import type { ApiResponse } from "shared/dist";

const port = parseInt(process.env.PORT || "4242");

const app = new Hono();

// api
if (process.env.NODE_ENV !== "production") {
	app.use(cors());
}

export const route = app
	.basePath("/api")
	.get("/", (c) => {
		return c.text("Hello Hono!");
	})

	.get("/hello", async (c) => {
		const data: ApiResponse = {
			message: "Hello BHVR!",
			success: true,
		};

		return c.json(data, { status: 200 });
	});

// ui
app
	.use("*", serveStatic({ root: "./static" }))
	.get("*", async (c, next) => {
		return serveStatic({ root: "./static", path: "index.html" })(c, next);
	});

export default {
	port,
	fetch: app.fetch,
};
