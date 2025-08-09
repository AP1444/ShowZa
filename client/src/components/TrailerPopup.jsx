import { useState, useEffect } from "react";
import { X } from "lucide-react";
import ReactPlayer from "react-player";
import axios from "axios";

const TrailerPopup = ({ isOpen, onClose, movieId, movieTitle }) => {
  const [trailerUrl, setTrailerUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTrailer = async () => {
    if (!movieId || !isOpen) return;

    try {
      setLoading(true);
      setError(null);

      const { data } = await axios.get(`/api/tmdb/movie/${movieId}/videos`);

      if (data.success) {
        // Find the first YouTube trailer
        const trailer = data.videos.find(
          (video) => video.type === "Trailer" && video.site === "YouTube"
        );

        if (trailer) {
          setTrailerUrl(`https://www.youtube.com/watch?v=${trailer.key}`);
        } else {
          setError("No trailer available for this movie");
        }
      } else {
        setError("Failed to fetch trailer");
      }
    } catch (error) {
      console.error("Error fetching trailer:", error);
      setError("Failed to load trailer");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && movieId) {
      fetchTrailer();
    } else {
      setTrailerUrl(null);
      setError(null);
    }
  }, [isOpen, movieId]);

  const handleClose = () => {
    setTrailerUrl(null);
    setError(null);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            {movieTitle} - Trailer
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="text-gray-400 text-lg mb-2">😔</div>
              <p className="text-gray-400 text-lg mb-2">Oops!</p>
              <p className="text-gray-500">{error}</p>
              <button
                onClick={handleClose}
                className="mt-4 px-4 py-2 bg-primary hover:bg-primary-dull transition rounded-lg"
              >
                Close
              </button>
            </div>
          )}

          {trailerUrl && !loading && (
            <div className="relative">
              <ReactPlayer
                src={trailerUrl}
                controls={true}
                width="100%"
                height="500px"
                config={{
                  youtube: {
                    playerVars: {
                      autoplay: 1,
                      modestbranding: 1,
                      rel: 0,
                    },
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrailerPopup;
