import { useState, useMemo } from "react";
import { Search, Filter, SortAsc, X } from "lucide-react";
import MovieCard from "../components/MovieCard";
import BlueCircle from "../components/BlueCircle";
import { useAppContext } from "../context/AppContext";

function Movies() {
  const { shows } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);

  // Get all unique genres from movies
  const allGenres = useMemo(() => {
    const genresSet = new Set();
    shows.forEach((movie) => {
      movie.genres.forEach((genre) => {
        genresSet.add(genre.name);
      });
    });
    return Array.from(genresSet).sort();
  }, [shows]);

  // Filter and sort movies
  const filteredAndSortedMovies = useMemo(() => {
    let filtered = shows;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (movie) =>
          movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          movie.overview.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by genres
    if (selectedGenres.length > 0) {
      filtered = filtered.filter((movie) =>
        movie.genres.some((genre) => selectedGenres.includes(genre.name))
      );
    }

    // Sort movies
    filtered = [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "release_date":
          aValue = new Date(a.release_date);
          bValue = new Date(b.release_date);
          break;
        case "vote_average":
          aValue = a.vote_average;
          bValue = b.vote_average;
          break;
        case "runtime":
          aValue = a.runtime;
          bValue = b.runtime;
          break;
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [shows, searchTerm, selectedGenres, sortBy, sortOrder]);

  const handleGenreToggle = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedGenres([]);
    setSortBy("title");
    setSortOrder("asc");
  };

  return shows.length > 0 ? (
    <div className="relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]">
      <BlueCircle top="150px" left="0px" />
      <BlueCircle bottom="50px" right="50px" />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <h1 className="text-lg font-medium mb-4 lg:mb-0">
          Now Showing ({filteredAndSortedMovies.length} movies)
        </h1>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search movies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-gray-400 w-full sm:w-64"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            {selectedGenres.length > 0 && (
              <span className="bg-primary text-xs px-2 py-1 rounded-full">
                {selectedGenres.length}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split("-");
              setSortBy(field);
              setSortOrder(order);
            }}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white"
          >
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
            <option value="release_date-desc">Newest First</option>
            <option value="release_date-asc">Oldest First</option>
            <option value="vote_average-desc">Highest Rated</option>
            <option value="vote_average-asc">Lowest Rated</option>
            <option value="runtime-desc">Longest First</option>
            <option value="runtime-asc">Shortest First</option>
          </select>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Filter by Genres</h3>
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {allGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => handleGenreToggle(genre)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  selectedGenres.includes(genre)
                    ? "bg-primary border-primary text-white"
                    : "bg-transparent border-gray-600 text-gray-300 hover:border-gray-500"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {selectedGenres.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-sm text-gray-400 mb-2">Selected genres:</p>
              <div className="flex flex-wrap gap-2">
                {selectedGenres.map((genre) => (
                  <span
                    key={genre}
                    className="flex items-center gap-1 px-2 py-1 bg-primary text-xs rounded-full"
                  >
                    {genre}
                    <button
                      onClick={() => handleGenreToggle(genre)}
                      className="hover:bg-primary-dull rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Movies Grid */}
      {filteredAndSortedMovies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-8">
          {filteredAndSortedMovies.map((movie) => (
            <MovieCard movie={movie} key={movie._id} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <Search className="w-12 h-12 text-gray-500 mb-4" />
          <h2 className="text-xl font-medium text-gray-300 mb-2">
            No movies found
          </h2>
          <p className="text-gray-500 text-center">
            Try adjusting your search terms or filters to find more movies.
          </p>
          <button
            onClick={clearAllFilters}
            className="mt-4 px-4 py-2 bg-primary hover:bg-primary-dull transition rounded-lg"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1>No movies available</h1>
    </div>
  );
}

export default Movies;
