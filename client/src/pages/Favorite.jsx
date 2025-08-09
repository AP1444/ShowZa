import MovieCard from '../components/MovieCard'
import BlueCircle from '../components/BlueCircle'
import { useAppContext } from '../context/AppContext'

function Favorite() {
  const {favoritesMovies} = useAppContext();
  return favoritesMovies.length > 0 ?(
    <div className='relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]'>
      <BlueCircle top="150px" left="0px" />
      <BlueCircle bottom="50px" right="50px" />
      <h1 className='text-lg font-medium my-4'>Your Favorite Movies</h1>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-8'>
        {favoritesMovies.map((movie) => (
          <MovieCard movie={movie} key={movie.id} />
        ))}
      </div>
    </div>
  ) : (
    <div className='flex flex-col items-center justify-center h-screen'>
      <h1>No movies available</h1>
    </div>
  )
}

export default Favorite