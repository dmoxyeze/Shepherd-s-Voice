export type TTranscript = {
  normalizedMessage: string;
  scriptures: string[];
  themes: string[];
  topic: string;
};

export type TSermonEmbedding = {
  sermonId: string;
  chunkId: number;
  embedding: number[];
};

export type TSermonMetadata = {
  sermonId: string;
  title: string;
  date: string;
  content: string;
};

export type TChunkedSermon = {
  sermonId: string;
  chunkId: number;
  content: string;
  topic?: string;
  themes?: string[];
  speaker?: string;
  date_preached?: string;
};
