import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { ApiError } from "../../api/api-error";
import { api } from "../../api/client";

import type { paths } from "../../api/schema";
import type {
  CreateMonsterRequest,
  UpdateMonsterRequest,
} from "./monster.form";

type MonsterPage
  = paths["/monsters"]["get"]["responses"][200]["content"]["application/json"];

export type Monster = MonsterPage["items"][number];

export const MONSTERS_PAGE_SIZE = 12;

export const monsterKeys = {
  all: ["monsters"] as const,
  detail: (id: string) => [...monsterKeys.all, "detail", id] as const,
  list: (page: number, pageSize: number) =>
    [...monsterKeys.lists(), { page, pageSize }] as const,
  lists: () => [...monsterKeys.all, "list"] as const,
};

export function useMonsters(page = 1, pageSize = MONSTERS_PAGE_SIZE) {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const { data, error, response } = await api.GET("/monsters", {
        params: { query: { page, pageSize } },
        signal,
      });
      if (error !== undefined || data === undefined) {
        throw new ApiError(response.status, error);
      }
      return data;
    },
    queryKey: monsterKeys.list(page, pageSize),
  });
}

export function useMonster(id: string) {
  return useQuery({
    queryFn: async ({ signal }) => {
      const { data, error, response } = await api.GET("/monsters/{id}", {
        params: { path: { id } },
        signal,
      });
      if (error !== undefined || data === undefined) {
        throw new ApiError(response.status, error);
      }
      return data;
    },
    queryKey: monsterKeys.detail(id),
  });
}

export function useCreateMonster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateMonsterRequest) => {
      const { data, error, response } = await api.POST("/monsters", { body });
      if (error !== undefined || data === undefined) {
        throw new ApiError(response.status, error);
      }
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: monsterKeys.lists() });
    },
  });
}

export function useUpdateMonster(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: UpdateMonsterRequest) => {
      const { data, error, response } = await api.PATCH("/monsters/{id}", {
        body,
        params: { path: { id } },
      });
      if (error !== undefined || data === undefined) {
        throw new ApiError(response.status, error);
      }
      return data;
    },
    onSuccess: async (monster) => {
      // the response is the updated monster: no need to refetch the detail
      queryClient.setQueryData(monsterKeys.detail(id), monster);
      await queryClient.invalidateQueries({ queryKey: monsterKeys.lists() });
    },
  });
}

export function useDeleteMonster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error, response } = await api.DELETE("/monsters/{id}", {
        params: { path: { id } },
      });
      // 404: already deleted (e.g. from another tab); the goal is met, so it is not an error
      if (error !== undefined && response.status !== 404) {
        throw new ApiError(response.status, error);
      }
    },
    onSuccess: async (_data, id) => {
      queryClient.removeQueries({ queryKey: monsterKeys.detail(id) });
      await queryClient.invalidateQueries({ queryKey: monsterKeys.lists() });
    },
  });
}
