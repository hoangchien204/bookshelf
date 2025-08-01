// utils/slugify.ts
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD') 
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '') 
    .trim()
    .replace(/\s+/g, '-'); 
}
