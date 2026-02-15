export type ID = string;

export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}
