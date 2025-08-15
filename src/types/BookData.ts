export interface BookData {
  name: string;
  author: string;
  genre: string;
  description: string;
  file?: File | null;
  cover?: File | null;
  isSeries?: boolean;
  seriesId?: string | null;
  seriesTitleNew?: string | null;
  volumeNumber?: number | null;
}