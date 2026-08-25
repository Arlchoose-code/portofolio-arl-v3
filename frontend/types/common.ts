export interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
}

export interface ApiMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ApiPaginatedResponse<T = any> {
  status: boolean;
  message: string;
  data: T[];
  meta: ApiMeta;
}

export interface PaginationParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}
