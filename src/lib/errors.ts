import axios from "axios";

interface ValidationIssue {
  msg?: unknown;
}

export function getApiStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

export function getApiDetail(error: unknown): unknown {
  return axios.isAxiosError(error) ? error.response?.data?.detail : undefined;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const detail = getApiDetail(error);
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item: ValidationIssue) => item?.msg)
      .filter((message): message is string => typeof message === "string");
    if (messages.length > 0) return messages.join(", ");
  }
  return error instanceof Error && error.message ? error.message : fallback;
}
