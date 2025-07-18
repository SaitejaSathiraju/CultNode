export type Game = {
  slug: string;
  title: string;
  year: number;
  segment: string;
  genres: string[];
  platform: string;
  poster: string;
  description: string;
};

export const games: Game[] = [
  {
    slug: "elden-ring",
    title: "Elden Ring",
    year: 2022,
    segment: "PC",
    genres: ["Action", "RPG"],
    platform: "PC, PS5, Xbox",
    poster: "https://m.media-amazon.com/images/I/81p+xe8cbnL._AC_SY679_.jpg",
    description: "An open-world action RPG developed by FromSoftware, set in a vast, fantastical world.",
  },
  {
    slug: "genshin-impact",
    title: "Genshin Impact",
    year: 2020,
    segment: "Mobile",
    genres: ["Action", "Adventure"],
    platform: "Mobile, PC, PS5",
    poster: "https://m.media-amazon.com/images/I/81p+xe8cbnL._AC_SY679_.jpg",
    description: "An open-world action RPG with gacha mechanics, set in the fantasy world of Teyvat.",
  },
  // Add more games as needed
]; 