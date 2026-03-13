import type { InboundSignalMessage } from "../dto/inbound-signal-message";
import { AssignmentService } from "../../services/assignment-service";
import type { SignalRouteResult } from "../signaling-context";

const assignmentService = new AssignmentService();

export async function handleAssignmentResponse(input: {
  message: InboundSignalMessage;
  actorId: string;
  actorRole: "signer" | "interpreter" | "admin";
}): Promise<SignalRouteResult> {
  return assignmentService.handleAssignmentResponse(input);
}
