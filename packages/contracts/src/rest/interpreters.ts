export type InterpreterActiveOffer = {
  assignmentAttemptId: string;
  callRequestId: string;
  interpreterId: string;
};

export type GetInterpreterActiveOfferResponse = {
  ok: true;
  activeOffer: InterpreterActiveOffer | null;
};
