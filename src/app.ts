import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { middleware as pendoIdentity } from "pendo-server-sdk";
import { type AuthLocals, requireAuth } from "./auth/require-auth.js";
import { accountsRouter } from "./routes/accounts.js";
import { assistantRouter } from "./routes/assistant.js";
import { authRouter } from "./routes/auth.js";
import { tripsRouter } from "./routes/trips.js";
import { usersRouter } from "./routes/users.js";

/** Builds the Tripwise API: JSON only, no pages of its own. */
export function createApp(corsOrigin: string) {
  const app = express();
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/api/auth", authRouter);

  // Everything else needs a signed-in session.
  app.use("/api/trips", requireAuth, tripsRouter);
  app.use("/api/users", requireAuth, usersRouter);
  app.use("/api/accounts", requireAuth, accountsRouter);
  app.use(
    "/api/assistant",
    requireAuth,
    // Tells Pendo whose conversation each assistant turn belongs to. requireAuth has put the user on res.locals.
    pendoIdentity((req: Request) => {
      const { user, account } = (req.res?.locals ?? {}) as Partial<AuthLocals>;
      const conversationId: unknown = req.body?.conversationId;
      return {
        visitorId: user?.id, // TODO: map to the visitor id your Pendo web snippet uses
        accountId: account?.id, // TODO: map to the Pendo account id your Pendo web snippet uses
        conversationId: typeof conversationId === "string" ? conversationId : undefined,
      };
    }),
    assistantRouter,
  );

  app.use((_req, res) => {
    res.status(404).json({ error: "not found" });
  });
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    res.status(500).json({ error: "something went wrong" });
  });
  return app;
}
