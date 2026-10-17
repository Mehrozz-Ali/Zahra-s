export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const toPositiveInt = (value: unknown, fallback: number): number => {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export function parsePagination(query: { page?: unknown; limit?: unknown }, defaultLimit = 12, maxLimit = 60): PaginationParams {
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, defaultLimit), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginationMeta(total: number, { page, limit }: Pick<PaginationParams, "page" | "limit">): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 };
}
