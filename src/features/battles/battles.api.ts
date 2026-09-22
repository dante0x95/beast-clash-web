import { useMutation, useQuery } from "@tanstack/react-query";

import { ApiError } from "../../api/api-error";
import { api } from "../../api/client";

import type { CreateBattleRequest } from "./battle.types";

export const battleKeys = {
  all: ["battles"] as const,
  detail: (id: string) => [...battleKeys.all, "detail", id] as const,
};

export function useBattle(id: string) {
  return useQuery({
    queryFn: async ({ signal }) => {
      const { data, error, response } = await api.GET("/battles/{id}", {
        params: { path: { id } },
        signal,
      });

      if (error !== undefined || data === undefined) {
        throw new ApiError(response.status, error);
      }

      return data;
    },
    queryKey: battleKeys.detail(id),
  });
}

export function useCreateBattle() {
  return useMutation({
    mutationFn: async (body: CreateBattleRequest) => {
      const { data, error, response } = await api.POST("/battles", { body });

      if (error !== undefined || data === undefined) {
        throw new ApiError(response.status, error);
      }

      return data;
    },
  });
}
