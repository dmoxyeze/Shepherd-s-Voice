export type TSermon = {
  id: string;
  topic: string;
  scriptures?: string[];
  preacher: string;
  full_text: string;
  date_preached: Date;
  themes?: string[];
  created_at: Date;
};

export type TSermonChunks = {
  id: string;
  sermon_id: number;
  chunk_id: number;
  content: string;
  embedding: number[];
  created_at: Date;
};

export type TPaginatedSermons = {
  data: TSermon[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type TSermonQueryParams = {
  page?: number;
  limit?: number;
  sortBy?: keyof TSermon;
  sortOrder?: "asc" | "desc";
  preacher?: string;
  fromDate?: Date;
  toDate?: Date;
  search?: string;
};
