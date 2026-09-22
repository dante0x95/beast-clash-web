import "./Pagination.css";

interface PaginationProps {
  readonly label: string;
  readonly onPageChange: (page: number) => void;
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}

export function Pagination({
  label,
  onPageChange,
  page,
  pageSize,
  total,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages === 1) return null;

  return (
    <nav aria-label={label} className="pagination">
      <button
        className="button"
        disabled={page <= 1}
        onClick={() => {
          onPageChange(page - 1);
        }}
        type="button"
      >
        ◀ Prev
      </button>
      <span aria-current="page" className="pagination__status">
        {`Page ${String(page)} of ${String(totalPages)}`}
      </span>
      <button
        className="button"
        disabled={page >= totalPages}
        onClick={() => {
          onPageChange(page + 1);
        }}
        type="button"
      >
        Next ▶
      </button>
    </nav>
  );
}
