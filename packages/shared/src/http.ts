export type ApiSuccessResponse<TData> = {
  data: TData;
};

export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

export type PaginatedResponse<TItem> = {
  data: TItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
};

export type ApiListQuery = {
  page?: number;
  pageSize?: number;
};
