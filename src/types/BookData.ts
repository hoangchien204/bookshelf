export interface Genre {
  id: string;
  name?: string;
}
export interface BookData {
  name: string;
  author: string;
  genre?: Genre | null;
  description: string;
  file?: File | null;
  cover?: File | null;
  isSeries?: boolean;
  seriesId?: string | null;
  seriesTitleNew?: string | null;
  volumeNumber?: number | null;
  genres?: Genre[] | null
}