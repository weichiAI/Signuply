import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RegistrationCreate } from "@shared/schema";

const API_BASE = "";

async function submitRegistration(data: RegistrationCreate): Promise<{ id: number; ticketNo: string }> {
  const res = await fetch(`${API_BASE}/api/registration`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "提交失败" }));
    throw new Error(err.message || "提交失败");
  }
  return res.json();
}

async function fetchRegistrationCount(): Promise<number> {
  const res = await fetch(`${API_BASE}/api/registration/count`);
  if (!res.ok) throw new Error("获取人数失败");
  const data = await res.json();
  return data.count;
}

export function useRegistrationSubmit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitRegistration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrationCount"] });
    },
  });
}

export function useRegistrationCount() {
  return useQuery({
    queryKey: ["registrationCount"],
    queryFn: fetchRegistrationCount,
    refetchInterval: 30000,
  });
}
