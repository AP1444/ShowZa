import axios from "axios";

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Configure axios for TMDB with retry logic
const tmdbApi = axios.create({
  baseURL: TMDB_BASE_URL,
  headers: {
    'Authorization': `Bearer ${TMDB_API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 20000, // Increased timeout to 20 seconds
  retry: 5, // Increased retries to 5
  retryDelay: 1500 // Increased initial delay
});

// Add retry interceptor
tmdbApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config } = error;
    
    if (!config || !config.retry) return Promise.reject(error);
    
    // Check if it's a network error that we should retry
    if (
      error.code === 'ECONNRESET' || 
      error.code === 'ETIMEDOUT' || 
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'EPIPE' ||
      (error.response && error.response.status >= 500) ||
      (error.response && error.response.status === 429)
    ) {
      config.__retryCount = config.__retryCount || 0;
      
      if (config.__retryCount < config.retry) {
        config.__retryCount += 1;
        
        // Exponential backoff with jitter
        const delay = config.retryDelay * Math.pow(2, config.__retryCount - 1) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return tmdbApi(config);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle TMDB API errors
const handleTMDBError = (error, operation) => {
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return {
      success: false,
      message: "Movie database temporarily unavailable. Please try again later."
    };
  }
  
  if (error.response?.status === 401) {
    return {
      success: false,
      message: "Invalid API configuration. Please contact support."
    };
  }
  
  if (error.response?.status === 429) {
    return {
      success: false,
      message: "Too many requests. Please wait a moment and try again."
    };
  }
  
  return {
    success: false,
    message: `Failed to ${operation}. Please try again.`
  };
};

// Get upcoming movie trailers (replaces frontend TrailerSection logic)
export const getUpcomingTrailers = async (req, res) => {
  try {
    const trailersData = [];
    let allHindiMovies = [];
    const currentDate = new Date().toISOString().split('T')[0];

    // Fetch all pages of upcoming movies
    let currentPage = 1;
    let totalPages = 1;

    do {
      try {
        const upcomingResponse = await tmdbApi.get('/movie/upcoming', {
          params: {
            language: 'en-US',
            page: currentPage
          }
        });

        totalPages = upcomingResponse.data.total_pages;

        // Filter for Hindi movies with future release dates
        const hindiMovies = upcomingResponse.data.results.filter(movie => 
          movie.original_language === 'hi' && 
          movie.release_date > currentDate
        );

        allHindiMovies = [...allHindiMovies, ...hindiMovies];
        currentPage++;

        // Limit to first 10 pages for performance
        if (currentPage > 10) break;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        break;
      }
    } while (currentPage <= totalPages);

    // Sort by vote_average and get top Hindi movies
    const topHindiMovies = allHindiMovies.sort((a, b) => b.vote_average - a.vote_average);
    let moviesToFetch = [...topHindiMovies];

    // If less than 5 Hindi movies, fetch additional popular movies
    if (moviesToFetch.length < 5) {
      let additionalMovies = [];
      let pageForPopular = 1;
      
      while (moviesToFetch.length < 5 && pageForPopular <= 5) {
        try {
          const popularResponse = await tmdbApi.get('/movie/upcoming', {
            params: {
              language: 'en-US',
              page: pageForPopular,
              sort_by: 'popularity.desc'
            }
          });
          
          const newMovies = popularResponse.data.results.filter(movie => 
            movie.release_date > currentDate &&
            !moviesToFetch.some(existing => existing.id === movie.id)
          );
          
          additionalMovies = [...additionalMovies, ...newMovies];
          pageForPopular++;
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          break;
        }
      }
      
      const sortedAdditionalMovies = additionalMovies.sort((a, b) => b.popularity - a.popularity);
      const needed = 5 - moviesToFetch.length;
      moviesToFetch = [...moviesToFetch, ...sortedAdditionalMovies.slice(0, needed)];
    } else {
      moviesToFetch = moviesToFetch.slice(0, 5);
    }

    // Fetch trailers for each selected movie
    for (const movie of moviesToFetch) {
      try {
        const trailerResponse = await tmdbApi.get(`/movie/${movie.id}/videos`);
        
        const videoTypePriority = [
          'Trailer', 'Teaser', 'Clip', 'Behind the Scenes', 
          'Featurette', 'Opening Credits', 'Bloopers'
        ];
        
        let selectedVideo = null;
        let videoType = 'Video';
        
        // Find best video type
        for (const type of videoTypePriority) {
          const video = trailerResponse.data.results.find(
            video => video.type === type && video.site === 'YouTube'
          );
          if (video) {
            selectedVideo = video;
            videoType = type;
            break;
          }
        }
        
        // Fallback to any YouTube video
        if (!selectedVideo) {
          selectedVideo = trailerResponse.data.results.find(
            video => video.site === 'YouTube'
          );
          if (selectedVideo) {
            videoType = selectedVideo.type || 'Video';
          }
        }

        const trailerData = {
          movieId: movie.id,
          title: movie.title,
          image: movie.backdrop_path,
          videoUrl: selectedVideo ? `https://www.youtube.com/watch?v=${selectedVideo.key}` : null,
          key: selectedVideo?.key || null,
          releaseDate: movie.release_date,
          voteAverage: movie.vote_average,
          videoType: selectedVideo ? videoType : null
        };

        trailersData.push(trailerData);

      } catch (error) {
        // Add movie without video as fallback
        trailersData.push({
          movieId: movie.id,
          title: movie.title,
          image: movie.backdrop_path,
          videoUrl: null,
          key: null,
          releaseDate: movie.release_date,
          voteAverage: movie.vote_average,
          videoType: null
        });
      }
    }

    res.json({
      success: true,
      trailers: trailersData
    });

  } catch (error) {
    const errorResponse = handleTMDBError(error, 'fetch movie trailers');
    res.status(500).json(errorResponse);
  }
};

// Search movies (replaces frontend AddShows TMDB calls)
export const searchMovies = async (req, res) => {
  try {
    const { 
      query, 
      movieType = 'now_playing', 
      page = 1, 
      language, 
      region 
    } = req.query;

    let endpoint;
    const params = {
      language: 'en-US',
      page: parseInt(page)
    };

    if (language) params.with_original_language = language;
    if (region) params.region = region;

    if (query?.trim()) {
      endpoint = '/search/movie';
      params.query = query.trim();
    } else {
      endpoint = `/movie/${movieType}`;
    }

    const response = await tmdbApi.get(endpoint, { params });

    res.json({
      success: true,
      results: response.data.results,
      totalPages: response.data.total_pages,
      totalResults: response.data.total_results,
      currentPage: parseInt(page)
    });

  } catch (error) {
    const errorResponse = handleTMDBError(error, 'search movies');
    res.status(500).json(errorResponse);
  }
};

// Get movie details with credits
export const getMovieDetails = async (req, res) => {
  try {
    const { movieId } = req.params;

    const [movieResponse, creditsResponse] = await Promise.all([
      tmdbApi.get(`/movie/${movieId}`),
      tmdbApi.get(`/movie/${movieId}/credits`)
    ]);

    const movieData = movieResponse.data;
    const creditsData = creditsResponse.data;

    const movieDetails = {
      id: movieData.id,
      title: movieData.title,
      overview: movieData.overview,
      poster_path: movieData.poster_path,
      backdrop_path: movieData.backdrop_path,
      genres: movieData.genres,
      cast: creditsData.cast,
      crew: creditsData.crew,
      release_date: movieData.release_date,
      original_language: movieData.original_language,
      tagline: movieData.tagline || "",
      vote_average: movieData.vote_average,
      runtime: movieData.runtime,
      production_companies: movieData.production_companies,
      production_countries: movieData.production_countries,
      spoken_languages: movieData.spoken_languages
    };

    res.json({
      success: true,
      movie: movieDetails
    });

  } catch (error) {
    const errorResponse = handleTMDBError(error, 'fetch movie details');
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    res.status(500).json(errorResponse);
  }
};

// Get movie videos/trailers
export const getMovieVideos = async (req, res) => {
  try {
    const { movieId } = req.params;

    const response = await tmdbApi.get(`/movie/${movieId}/videos`);

    res.json({
      success: true,
      videos: response.data.results
    });

  } catch (error) {
    const errorResponse = handleTMDBError(error, 'fetch movie videos');
    res.status(500).json(errorResponse);
  }
};
