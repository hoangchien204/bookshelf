import type { Genre } from "./BookData";

export interface Book {
  id: string;
  name: string;
  author: string;
  description?: string;
  genre?: Genre | null;
  coverUrl: string;
  fileUrl: string;
  fileType?: string;
  createdAt: string;
  isSeries?: boolean;
  volumeNumber?: number;
}