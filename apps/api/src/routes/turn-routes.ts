import { Router, type Express } from "express";
import {
  TurnCredentialService,
  type TurnCredentialResponse
} from "../services/turn-credential-service";

type TurnCredentialsApiResponse = {
  ok: true;
  turn: TurnCredentialResponse;
};

export function registerTurnRoutes(app: Express) {
  const router = Router();
  const turnCredentialService = new TurnCredentialService();

  router.get("/credentials", (_request, response) => {
    const body: TurnCredentialsApiResponse = {
      ok: true,
      turn: turnCredentialService.getIceServers()
    };

    response.json(body);
  });

  app.use("/turn", router);
}
