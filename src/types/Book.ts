export interface Book {
  id: string;
  name: string;
  author: string;
  description?: string;
  genre?: string;
  coverUrl: string;
  fileUrl: string;
  fileType?: string;
  createdAt: string;
  isSeries?: boolean;   
  volumeNumber?: number; 
}