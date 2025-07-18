export type Movie = {
  slug: string;
  title: string;
  year: number;
  segment: string;
  cast: string[];
  director: string;
  genres: string[];
  poster: string;
  description: string;
};

export const movies: Movie[] = [
  {
    slug: "inception",
    title: "Inception",
    year: 2010,
    segment: "Hollywood",
    cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Ellen Page"],
    director: "Christopher Nolan",
    genres: ["Sci-Fi", "Thriller"],
    poster: "https://m.media-amazon.com/images/I/51s+z8QwKPL._AC_.jpg",
    description: "A thief who enters the dreams of others to steal secrets is given a chance to have his past crimes forgiven, by planting an idea into a target's subconscious.",
  },
  {
    slug: "3-idiots",
    title: "3 Idiots",
    year: 2009,
    segment: "Bollywood",
    cast: ["Aamir Khan", "R. Madhavan", "Sharman Joshi"],
    director: "Rajkumar Hirani",
    genres: ["Comedy", "Drama"],
    poster: "https://m.media-amazon.com/images/I/81p+xe8cbnL._AC_SY679_.jpg",
    description: "Two friends are searching for their long lost companion. They revisit their college days and recall the memories of their friend who inspired them to think differently.",
  },
  {
    slug: "bahubali",
    title: "Baahubali: The Beginning",
    year: 2015,
    segment: "Tollywood",
    cast: ["Prabhas", "Rana Daggubati", "Anushka Shetty"],
    director: "S. S. Rajamouli",
    genres: ["Action", "Drama"],
    poster: "https://m.media-amazon.com/images/I/91z7r+6nKPL._AC_SY679_.jpg",
    description: "In ancient India, an adventurous and daring man becomes involved in a decades-old feud between two warring peoples.",
  },
  // Add more movies as needed
]; 