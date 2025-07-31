export interface Book {
  id: string;
  name: string;
  author: string;
  genre?: string;
  description?: string;
  coverUrl: string;
  fileUrl: string;
  createdAt: string;
}
