import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { ApiError } from "../../api/api-error";
import { api } from "../../api/client";

import type { paths } from "../../api/schema";

type MonsterPage
  = paths["/monsters"]["get"]["responses"][200]["content"]["application/json"];

export type Monster = MonsterPage["items"][number];

export const MONSTERS_PAGE_SIZE = 12;

export const monsterKeys = {
  all: ["monsters"] as const,
  list: (page: number, pageSize: number) =>
    [...monsterKeys.all, "list", { page, pageSize }] as const,
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
