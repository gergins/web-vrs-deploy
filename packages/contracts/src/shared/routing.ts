export const routingModes = ["sequential", "simultaneous"] as const;

export type RoutingMode = (typeof routingModes)[number];
