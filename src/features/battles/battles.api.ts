import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { ApiError } from "../../api/api-error";
import { api } from "../../api/client";

import type { CreateBattleRequest } from "./battle.types";

export const BATTLES_PAGE_SIZE = 10;

export const battleKeys = {
  all: ["battles"] as const,
  detail: (id: string) => [...battleKeys.all, "detail", id] as const,
  list: (page: number, pageSize: number) =>
    [...battleKeys.lists(), { page, pageSize }] as const,
  lists: () => [...battleKeys.all, "list"] as const,
};

export function useBattles(page = 1, pageSize = BATTLES_PAGE_SIZE) {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const { data, error, response } = await api.GET("/battles", {
        params: { query: { page, pageSize } },
        signal,
      });

      if (error !== undefined || data === undefined) {
        throw new ApiError(response.status, error);
      }

      return data;
    },
    queryKey: battleKeys.list(page, pageSize),
  });
}

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateBattleRequest) => {
      const { data, error, response } = await api.POST("/battles", { body });

      if (error !== undefined || data === undefined) {
        throw new ApiError(response.status, error);
      }

      return data;
    },
    onSuccess: async (battle) => {
      // the response is the full battle: the detail page renders without a second request
      queryClient.setQueryData(battleKeys.detail(battle.id), battle);
      await queryClient.invalidateQueries({ queryKey: battleKeys.lists() });
    },
  });
}
