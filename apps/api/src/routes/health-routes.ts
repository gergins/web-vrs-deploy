import type { Express, Request, Response } from "express";

export function registerHealthRoutes(app: Express) {
  app.get("/health", (_request: Request, response: Response) => {
    response.json({
      ok: true,
      service: "api",
      timestamp: new Date().toISOString()
    });
  });
}
