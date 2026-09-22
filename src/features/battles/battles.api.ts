import { useMutation } from "@tanstack/react-query";

import { ApiError } from "../../api/api-error";
import { api } from "../../api/client";

import type { CreateBattleRequest } from "./battle.types";

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
