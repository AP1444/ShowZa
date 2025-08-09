import { useEffect, useState } from "react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import { dateFormat } from "../../lib/dateFormat";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

function ListShows() {
  const { axios, getToken, user } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;

  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [movieTitleFilter, setMovieTitleFilter] = useState("");

  const getAllShows = async (
    selectedFilter = filter,
    titleFilter = movieTitleFilter
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedFilter && selectedFilter !== "all") {
        params.append("filter", selectedFilter);
      }
      if (titleFilter) {
        params.append("movieTitle", titleFilter);
      }

      const { data } = await axios.get(
        `/api/admin/all-shows?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );
      if (data.success) {
        setShows(data.shows);
      } else {
        toast.error(data.message);
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
      toast.error("Failed to fetch shows");
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    getAllShows(newFilter, movieTitleFilter);
  };

  const handleMovieSearch = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      getAllShows(filter, movieTitleFilter);
    }
  };

  const clearFilters = () => {
    setFilter("all");
    setMovieTitleFilter("");
    getAllShows("all", "");
  };

  useEffect(() => {
    if (user) {
      getAllShows();
    }
  }, [user]);

  return !loading ? (
    <>
      <Title text1="List" text2="Shows" />

      {/* Filter Controls */}
      <div className="max-w-4xl mt-6 mb-4">
        <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
          {/* Status Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange("all")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-primary text-white"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              }`}
            >
              All Shows
            </button>
            <button
              onClick={() => handleFilterChange("upcoming")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === "upcoming"
                  ? "bg-green-600 text-white"
                  : "bg-green-100 text-green-600 hover:bg-green-200"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => handleFilterChange("completed")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === "completed"
                  ? "bg-gray-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Completed
            </button>
          </div>

          {/* Movie Title Search */}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Search by movie title..."
              value={movieTitleFilter}
              onChange={(e) => setMovieTitleFilter(e.target.value)}
              onKeyPress={handleMovieSearch}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              onClick={handleMovieSearch}
              className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90 transition-colors"
            >
              Search
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-600 mb-2">
          Showing {shows.length} show{shows.length !== 1 ? "s" : ""}
          {filter !== "all" && ` (${filter})`}
          {movieTitleFilter && ` matching "${movieTitleFilter}"`}
        </p>
      </div>

      <div className="max-w-5xl overflow-x-auto">
        <table className="w-full text-left border-collapse rounded-md overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 font-medium pl-5">Movie Name</th>
              <th className="p-2 font-medium">Show Time</th>
              <th className="p-2 font-medium">Status</th>
              <th className="p-2 font-medium">Total Bookings</th>
              <th className="p-2 font-medium">Seats Booked</th>
              <th className="p-2 font-medium">Earnings</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {shows.map((show, index) => (
              <tr
                key={index}
                className="border-b border-primary/10 bg-primary/5 even:bg-primary/10"
              >
                <td className="p-2 min-w-45 pl-5">{show.movie.title}</td>
                <td className="p-2">{dateFormat(show.showDateTime)}</td>
                <td className="p-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      show.status === "upcoming"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {show.status === "upcoming" ? "Upcoming" : "Completed"}
                  </span>
                </td>
                <td className="p-2">{show.totalBookings || 0}</td>
                <td className="p-2">{show.totalSeatsBooked || 0}</td>
                <td className="p-2">
                  {currency}
                  {show.showPrice * (show.totalSeatsBooked || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {shows.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No shows found matching the current filters.
          </div>
        )}
      </div>
    </>
  ) : (
    <Loading />
  );
}

export default ListShows;
