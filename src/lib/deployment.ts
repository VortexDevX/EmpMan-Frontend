const gatewayAdminEnv = import.meta.env.VITE_ENABLE_GATEWAY_ADMIN;

export const gatewayAdminEnabled =
  gatewayAdminEnv === "true";

export function getGatewayAdminModeLabel(): string {
  return gatewayAdminEnabled ? "enabled" : "disabled";
}
