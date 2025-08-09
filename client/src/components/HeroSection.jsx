import { useState, useEffect } from "react";
import { ArrowRight, CalendarIcon, ClockIcon, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import Loading from "./Loading";
import axios from "axios";

function HeroSection() {
  const [topMovie, setTopMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { image_base_url } = useAppContext();

  useEffect(() => {
    fetchTopBookedMovie();
  }, []);

  const fetchTopBookedMovie = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/booking/top-movie");

      if (data.success) {
        setTopMovie(data.movie);
      } else {
        throw new Error(data.message || "Failed to fetch top movie");
      }
    } catch (error) {
      console.error("Error fetching top booked movie:", error);
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 md:px-16 lg:px-36 bg-gray-900 h-screen">
        <Loading />
        <p className="text-gray-300">Loading top movie...</p>
      </div>
    );
  }

  if (error || !topMovie) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 px-6 md:px-16 lg:px-36 bg-gray-900 h-screen">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Unable to load movie data</h2>
          <p className="text-gray-400 mb-4">
            {error || "No movie data available"}
          </p>
          <button
            className="flex items-center gap-1 px-6 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer"
            onClick={() => navigate("/movies")}
          >
            Explore Movies
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Create background image URL
  const backgroundImage = topMovie.backdrop_path
    ? `${image_base_url}${topMovie.backdrop_path}`
    : "/backgroundImage.png";

  // Get genres string
  const genresString = topMovie.genres
    ? topMovie.genres
        .slice(0, 3)
        .map((genre) => (typeof genre === "string" ? genre : genre.name))
        .join(" | ")
    : "Action | Adventure | Sci-Fi";

  // Get release year
  const releaseYear = topMovie.release_date
    ? new Date(topMovie.release_date).getFullYear()
    : "2024";

  // Format runtime
  const formatRuntime = (minutes) => {
    if (!minutes) return "2h 8m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div
      className="flex flex-col items-start justify-center gap-4 px-6 md:px-16 lg:px-36 bg-cover bg-center h-screen relative"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${backgroundImage})`,
      }}
    >
      {/* Popular movie badge */}
      <div className="inline-flex items-center bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4 mt-20">
        <Star className="w-4 h-4 mr-2 fill-current" />
        #1 Most Booked Movie
        {topMovie.totalBookings > 0 && (
          <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded">
            {topMovie.totalBookings} bookings
          </span>
        )}
      </div>

      <h1 className="text-5xl md:text-[70px] md:leading-18 font-semibold max-w-110">
        {topMovie.title || topMovie.original_title || "Featured Movie"}
      </h1>

      <div className="flex items-center gap-4 text-gray-300">
        <span>{genresString}</span>
        <div className="flex items-center gap-1">
          <CalendarIcon className="w-4.5 h-4.5" /> {releaseYear}
        </div>
        <div className="flex items-center gap-1">
          <ClockIcon className="w-4.5 h-4.5" />{" "}
          {formatRuntime(topMovie.runtime)}
        </div>
        {topMovie.vote_average && (
          <div className="flex items-center gap-1">
            <Star className="w-4.5 h-4.5 fill-yellow-400 text-yellow-400" />
            {topMovie.vote_average.toFixed(1)}
          </div>
        )}
      </div>

      <p className="max-w-md text-gray-300">
        {topMovie.overview ||
          topMovie.description ||
          "Experience the magic of cinema with this incredible movie that has captured the hearts of audiences worldwide."}
      </p>

      <div className="flex gap-3">
        <button
          className="flex items-center gap-1 px-6 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer"
          onClick={() => navigate(`/movie-details/${topMovie._id}`)}
        >
          View Details
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          className="flex items-center gap-1 px-6 py-3 text-sm bg-transparent border border-white/30 hover:bg-white/10 transition rounded-full font-medium cursor-pointer text-white"
          onClick={() => navigate("/movies")}
        >
          Explore Movies
        </button>
      </div>
    </div>
  );
}

export default HeroSection;
