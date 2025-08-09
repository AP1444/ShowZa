import { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import {
  CheckIcon,
  DeleteIcon,
  StarIcon,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { kConverter } from "../../lib/kConverter";
import { useAppContext } from "../../context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";

function AddShows() {
  const { getToken, user, image_base_url } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;

  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [dateTimeSelection, setDateTimeSelection] = useState({});
  const [dateTimeInput, setDateTimeInput] = useState("");
  const [showPrice, setShowPrice] = useState("");
  const [addingShow, setAddingShow] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter and pagination states
  const [movieType, setMovieType] = useState("now_playing");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Available languages and regions
  const languages = [
    { code: "", name: "All Languages" },
    { code: "en", name: "English" },
    { code: "hi", name: "Hindi" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese" },
    { code: "ta", name: "Tamil" },
    { code: "te", name: "Telugu" },
    { code: "bn", name: "Bengali" },
    { code: "mr", name: "Marathi" },
  ];

  const regions = [
    { code: "", name: "All Regions" },
    { code: "US", name: "United States" },
    { code: "IN", name: "India" },
    { code: "GB", name: "United Kingdom" },
    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
    { code: "FR", name: "France" },
    { code: "DE", name: "Germany" },
    { code: "JP", name: "Japan" },
    { code: "KR", name: "South Korea" },
    { code: "CN", name: "China" },
  ];

  const fetchMovies = async (isNewSearch = false) => {
    try {
      if (isNewSearch) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }

      const params = {
        movieType,
        page: currentPage,
        ...(searchTerm.trim() && { query: searchTerm.trim() }),
        ...(selectedLanguage && { language: selectedLanguage }),
        ...(selectedRegion && { region: selectedRegion }),
      };

      const { data } = await axios.get("/api/tmdb/search", { params });

      if (data.success) {
        setMovies(data.results || []);
        setTotalPages(data.totalPages || 1);
        console.log(
          `Fetched ${data.results?.length || 0} movies for page ${currentPage}`
        );
      } else {
        toast.error("Failed to fetch movies");
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
      toast.error(
        "Error fetching movies: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const handleDateTimeAdd = () => {
    if (!dateTimeInput) return;

    // Check if it's an upcoming movie and validate release date
    if (selectedMovie && movieType === "upcoming") {
      const movie = movies.find((m) => m.id === selectedMovie);
      if (movie) {
        const releaseDate = new Date(movie.release_date);
        const selectedDate = new Date(dateTimeInput.split("T")[0]);

        if (selectedDate < releaseDate) {
          toast.error(
            `Cannot add show before movie release date: ${movie.release_date}`
          );
          return;
        }
      }
    }

    const [date, time] = dateTimeInput.split("T");
    if (!date || !time) return;

    setDateTimeSelection((prev) => {
      const times = prev[date] || [];
      if (!times.includes(time)) {
        return {
          ...prev,
          [date]: [...times, time],
        };
      }
      return prev;
    });
  };

  const handleRemoveTime = (date, time) => {
    setDateTimeSelection((prev) => {
      const filteredTimes = prev[date].filter((t) => t !== time);
      if (filteredTimes.length === 0) {
        const { [date]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [date]: filteredTimes };
    });
  };

  const handleSubmit = async () => {
    try {
      setAddingShow(true);
      if (
        !selectedMovie ||
        Object.keys(dateTimeSelection).length === 0 ||
        !showPrice
      ) {
        return toast("Missing required fields");
      }

      const showInput = Object.entries(dateTimeSelection).map(
        ([date, time]) => ({
          date,
          time,
        })
      );

      const payload = {
        movieId: selectedMovie,
        showInput,
        showPrice: Number(showPrice),
      };
      const { data } = await axios.post("/api/show/add", payload, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });

      if (data.success) {
        toast.success("Show added successfully");
        setSelectedMovie(null);
        setDateTimeSelection({});
        setShowPrice("");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error adding show:", error);
      toast.error("Failed to add show");
    }
    setAddingShow(false);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMovies(true);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    fetchMovies(true);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedLanguage("");
    setSelectedRegion("");
    setCurrentPage(1);
    // Fetch default movies after clearing
    setTimeout(() => {
      fetchMovies(true);
    }, 100);
  };

  useEffect(() => {
    if (user && !searchTerm.trim()) {
      // Only auto-fetch when there's no search term
      fetchMovies();
    }
  }, [user, currentPage, movieType]);

  useEffect(() => {
    if (user && (selectedLanguage || selectedRegion) && !searchTerm.trim()) {
      // Only auto-apply filters when there's no search term
      handleFilterChange();
    }
  }, [selectedLanguage, selectedRegion]);

  const selectedMovieData = movies.find((m) => m.id === selectedMovie);

  return (
    <>
      <Title text1="Add" text2="Shows" />

      {/* Movie Type Selector */}
      <div className="mt-10 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => {
              setMovieType("now_playing");
              setCurrentPage(1);
              setSelectedMovie(null);
              setDateTimeSelection({});
            }}
            className={`px-6 py-2 rounded-lg transition-colors ${
              movieType === "now_playing"
                ? "bg-primary text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Now Playing Movies
          </button>
          <button
            onClick={() => {
              setMovieType("upcoming");
              setCurrentPage(1);
              setSelectedMovie(null);
              setDateTimeSelection({});
            }}
            className={`px-6 py-2 rounded-lg transition-colors ${
              movieType === "upcoming"
                ? "bg-primary text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Upcoming Movies
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search movies by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10 pr-10 py-3 bg-slate-800 border border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-slate-400 w-full"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                  setTimeout(() => fetchMovies(true), 100);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={searchLoading || !searchTerm.trim()}
            className="px-6 py-3 bg-primary hover:bg-primary-dull transition rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searchLoading ? "Searching..." : "Search"}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 transition rounded-lg text-white"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-600">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Region</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white"
                >
                  {regions.map((region) => (
                    <option key={region.code} value={region.code}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 transition rounded-lg text-white"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          {/* Movies Grid */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-lg font-medium">
                {searchTerm
                  ? `Search Results for "${searchTerm}"`
                  : movieType === "now_playing"
                  ? "Now Playing Movies"
                  : "Upcoming Movies"}{" "}
                ({movies.length} movies)
              </p>

              {/* Pagination Info */}
              <p className="text-sm text-slate-400">
                Page {currentPage} of {totalPages}
              </p>
            </div>

            {movies.length > 0 ? (
              <div className="overflow-x-auto pb-4">
                <div className="group grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 w-full">
                  {movies.map((movie) => (
                    <div
                      key={movie.id}
                      className={`relative cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300 ${
                        selectedMovie === movie.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => {
                        setSelectedMovie(movie.id);
                        setDateTimeSelection({});
                      }}
                    >
                      <div className="relative rounded-lg overflow-hidden">
                        <img
                          src={image_base_url + movie.poster_path}
                          alt=""
                          className="w-full h-60 object-cover brightness-90"
                          onError={(e) => {
                            e.target.src = "/placeholder-movie.png";
                          }}
                        />
                        <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">
                          <p className="flex items-center gap-1 text-slate-400">
                            <StarIcon className="w-4 h-4 text-secondary fill-secondary" />
                            {movie.vote_average?.toFixed(1) || "N/A"}
                          </p>
                          <p className="text-slate-300">
                            {movie.vote_count
                              ? kConverter(movie.vote_count)
                              : "0"}{" "}
                            Votes
                          </p>
                        </div>
                        {movie.original_language && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
                            {movie.original_language.toUpperCase()}
                          </div>
                        )}
                      </div>
                      {selectedMovie === movie.id && (
                        <div className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-primary rounded">
                          <CheckIcon
                            className="w-4 h-4 text-white"
                            strokeWidth={2.5}
                          />
                        </div>
                      )}
                      <p className="font-medium truncate mt-2">{movie.title}</p>
                      <p className="text-sm text-slate-400">
                        {movie.release_date}
                      </p>
                      {movieType === "upcoming" && (
                        <p className="text-xs text-yellow-400">
                          Release:{" "}
                          {new Date(movie.release_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400">No movies found</p>
                {searchTerm && (
                  <button
                    onClick={clearFilters}
                    className="mt-2 px-4 py-2 bg-primary hover:bg-primary-dull transition rounded-lg text-white"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition rounded-lg text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-lg transition ${
                          currentPage === pageNum
                            ? "bg-primary text-white"
                            : "bg-slate-700 hover:bg-slate-600 text-white"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition rounded-lg text-white"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Selected Movie Info */}
          {selectedMovieData && (
            <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-600">
              <h3 className="text-lg font-medium mb-2">Selected Movie</h3>
              <div className="flex gap-4">
                <img
                  src={image_base_url + selectedMovieData.poster_path}
                  alt=""
                  className="w-16 h-24 object-cover rounded"
                />
                <div>
                  <p className="font-medium">{selectedMovieData.title}</p>
                  <p className="text-sm text-gray-400">
                    Release: {selectedMovieData.release_date}
                  </p>
                  <p className="text-sm text-slate-400">
                    Language:{" "}
                    {selectedMovieData.original_language?.toUpperCase()}
                  </p>
                  <p className="text-sm text-slate-400">
                    Rating: {selectedMovieData.vote_average?.toFixed(1)}/10
                  </p>
                  {movieType === "upcoming" &&
                    new Date(selectedMovieData.release_date) > new Date() && (
                      <p className="text-xs text-yellow-400 mt-1">
                        ⚠️ Shows can only be added after release date
                      </p>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* Show Configuration */}
          {selectedMovie && (
            <>
              <div className="mt-8">
                <label className="block text-sm font-medium mb-2">
                  Show Price
                </label>
                <div className="inline-flex items-center gap-2 border border-slate-600 px-3 py-2 rounded-md">
                  <p className="text-slate-400 text-sm">{currency}</p>
                  <input
                    min={0}
                    type="number"
                    value={showPrice}
                    onChange={(e) => setShowPrice(e.target.value)}
                    placeholder="Enter show price"
                    className="outline-none bg-transparent text-white"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium mb-2">
                  Show Date & Time
                </label>
                <div className="inline-flex gap-5 border border-gray-600 p-1 pl-3 rounded-lg">
                  <input
                    type="datetime-local"
                    value={dateTimeInput}
                    onChange={(e) => setDateTimeInput(e.target.value)}
                    min={
                      movieType === "upcoming" && selectedMovieData
                        ? selectedMovieData.release_date
                        : undefined
                    }
                    className="outline-none rounded-md bg-transparent text-white"
                  />
                  <button
                    onClick={handleDateTimeAdd}
                    className="px-3 py-2 bg-primary/80 text-white text-sm rounded-lg hover:bg-primary cursor-pointer"
                  >
                    Add Time
                  </button>
                </div>
                {movieType === "upcoming" && selectedMovieData && (
                  <p className="text-xs text-gray-400 mt-1">
                    Minimum date: {selectedMovieData.release_date}
                  </p>
                )}
              </div>

              {Object.keys(dateTimeSelection).length > 0 && (
                <div className="mt-6">
                  <h2 className="mb-2">Selected Date-Time</h2>
                  <ul className="space-y-3">
                    {Object.entries(dateTimeSelection).map(([date, times]) => (
                      <li key={date}>
                        <div className="font-medium">{date}</div>
                        <div className="flex flex-wrap gap-2 mt-1 text-sm">
                          {times.map((time) => (
                            <div
                              key={time}
                              className="border border-primary px-2 py-1 flex items-center rounded"
                            >
                              <span>{time}</span>
                              <DeleteIcon
                                onClick={() => handleRemoveTime(date, time)}
                                width={15}
                                className="ml-2 text-red-500 hover:text-red-700 cursor-pointer"
                              />
                            </div>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={
                  addingShow ||
                  !selectedMovie ||
                  Object.keys(dateTimeSelection).length === 0 ||
                  !showPrice
                }
                className="bg-secondary text-white px-8 py-2 mt-6 rounded hover:bg-secondary-dull transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingShow ? "Adding Show..." : "Add Show"}
              </button>
            </>
          )}
        </>
      )}
    </>
  );
}

export default AddShows;
