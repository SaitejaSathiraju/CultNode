export type Anime = {
  slug: string;
  title: string;
  year: number;
  segment: string;
  genres: string[];
  poster: string;
  description: string;
};

export const animeList: Anime[] = [
  {
    slug: "naruto",
    title: "Naruto",
    year: 2002,
    segment: "Shonen",
    genres: ["Action", "Adventure"],
    poster: "https://m.media-amazon.com/images/I/81p+xe8cbnL._AC_SY679_.jpg",
    description: "Naruto Uzumaki, a young ninja, seeks recognition from his peers and dreams of becoming the Hokage, the leader of his village.",
  },
  {
    slug: "your-name",
    title: "Your Name",
    year: 2016,
    segment: "Romance",
    genres: ["Drama", "Supernatural"],
    poster: "https://m.media-amazon.com/images/I/71nK+Q1QKPL._AC_SY679_.jpg",
    description: "Two teenagers share a profound, magical connection upon discovering they are swapping bodies.",
  },
  // Add more anime as needed
]; 