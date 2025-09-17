import { useToast } from "@/components/ui/toast-provider";

export async function fetchWithToast(input: RequestInfo, init?: RequestInit) {
  const { showToast } = useToast();
  try {
    const res = await fetch(input, init);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast(data?.message || res.statusText, "error");
    }
    return res;
  } catch (err: any) {
    showToast(err?.message || "Network error", "error");
    throw err;
  }
}
