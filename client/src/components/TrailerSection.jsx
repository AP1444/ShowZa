import { useState, useEffect } from "react";
import ReactPlayer from "react-player";
import BlueCircle from "./BlueCircle";
import { PlayCircleIcon } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import axios from "axios";

function TrailerSection() {
  const { image_base_url } = useAppContext();
  const [movieTrailers, setMovieTrailers] = useState([]);
  const [currentTrailer, setCurrentTrailer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch trailers from backend API
  const fetchMovieTrailers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/tmdb/trailers");

      if (data.success) {
        // Process trailers data to include full image URLs
        const processedTrailers = data.trailers.map((trailer) => ({
          ...trailer,
          image: trailer.image ? `${image_base_url}${trailer.image}` : null,
        }));

        setMovieTrailers(processedTrailers);
        if (processedTrailers.length > 0) {
          setCurrentTrailer(processedTrailers[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching movie trailers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovieTrailers();
  }, [image_base_url]);

  if (loading) {
    return (
      <div className="px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden">
        <p className="text-gray-300 font-medium text-lg max-w-[960px] mx-auto">
          Upcoming Movie Videos
        </p>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (movieTrailers.length === 0) {
    return (
      <div className="px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden">
        <p className="text-gray-300 font-medium text-lg max-w-[960px] mx-auto">
          Upcoming Movie Videos
        </p>
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400">No movie videos available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden">
      <p className="text-gray-300 font-medium text-lg max-w-[960px] mx-auto">
        Upcoming Movie Videos
      </p>

      <div className="relative mt-6">
        <BlueCircle top="-100px" right="-100px" />
        {currentTrailer?.videoUrl ? (
          <ReactPlayer
            src={currentTrailer.videoUrl}
            controls={true}
            className="mx-auto max-w-full"
            width="960px"
            height="540px"
            config={{
              youtube: {
                playerVars: {
                  showinfo: 1,
                  modestbranding: 1,
                },
              },
            }}
          />
        ) : (
          <div className="mx-auto max-w-[960px] h-[540px] bg-gray-800 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <PlayCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">{currentTrailer?.title}</p>
              <p className="text-gray-500 text-sm mt-2">
                Trailer not available
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="group grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mt-8 max-w-5xl mx-auto">
        {movieTrailers.map((trailer, index) => (
          <div
            key={trailer.movieId}
            className={`relative group-hover:not-hover:opacity-50 hover:-translate-y-1 duration-300 transition max-md:h-60 md:max-h-60 cursor-pointer border-2 rounded-lg ${
              currentTrailer?.movieId === trailer.movieId
                ? "border-primary"
                : "border-transparent"
            }`}
            onClick={() => setCurrentTrailer(trailer)}
          >
            <img
              src={trailer.image}
              alt={`${trailer.title} trailer`}
              className="rounded-lg w-full h-full object-cover brightness-75"
            />
            <PlayCircleIcon
              strokeWidth={1.6}
              className={`absolute top-1/2 left-1/2 w-5 md:w-8 h-5 md:h-8 transform -translate-x-1/2 -translate-y-1/2 ${
                trailer.videoUrl ? "text-white" : "text-gray-400"
              }`}
            />

            {/* Movie info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 rounded-b-lg">
              <p className="text-xs text-white font-medium truncate mb-1">
                {trailer.title}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
                <span>⭐ {trailer.voteAverage?.toFixed(1)}</span>
                <span>{new Date(trailer.releaseDate).getFullYear()}</span>
              </div>
              {trailer.videoType && (
                <div className="text-center">
                  <span className="inline-block px-2 py-0.5 bg-primary/80 text-white text-xs rounded-full">
                    {trailer.videoType}
                  </span>
                </div>
              )}
            </div>

            {currentTrailer?.movieId === trailer.movieId && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"></div>
            )}
          </div>
        ))}
      </div>

      {currentTrailer && (
        <div className="text-center mt-6">
          <h3 className="text-xl font-semibold text-white mb-2">
            {currentTrailer.title}
          </h3>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-400 mb-2">
            <span className="flex items-center gap-1">
              ⭐ {currentTrailer.voteAverage?.toFixed(1)} Rating
            </span>
            <span>•</span>
            <span>
              Release:{" "}
              {new Date(currentTrailer.releaseDate).toLocaleDateString(
                "en-US",
                {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }
              )}
            </span>
            {currentTrailer.videoType && (
              <>
                <span>•</span>
                <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                  {currentTrailer.videoType}
                </span>
              </>
            )}
          </div>
          {!currentTrailer.videoUrl && (
            <p className="text-gray-400 text-sm">
              Video not available for this movie
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default TrailerSection;
