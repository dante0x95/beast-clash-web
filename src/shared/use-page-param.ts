import { useSearchParams } from "react-router";

/** Reads `?page=` as a positive integer (defaults to 1) and returns a setter that keeps other params. */
export function usePageParam(): [number, (page: number) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = Number(searchParams.get("page"));
  const page = Number.isInteger(raw) && raw >= 1 ? raw : 1;

  const setPage = (next: number): void => {
    setSearchParams((params) => {
      if (next <= 1) params.delete("page");
      else params.set("page", String(next));
      return params;
    });
  };

  return [page, setPage];
}
