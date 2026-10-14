import { useEffect, useState } from "react";

import { PAGE_SIZE, getPageCount } from "@/lib/pagination";

/**
 * Server-driven offset pagination state.
 * Resets to page 1 when `resetKey` changes (e.g. search cleared).
 */
export function useServerPagination(resetKey?: string | number) {
  const [page, setPage] = useState(1);
  const pageSize = PAGE_SIZE;

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  return {
    page,
    setPage,
    pageSize,
    getPageCount: (total: number) => getPageCount(total, pageSize),
  };
}
