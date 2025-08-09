import { useEffect, useState } from 'react'
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import { dateFormat } from '../../lib/dateFormat';
import { useAppContext } from '../../context/AppContext';

function ListBookings() {

  const { axios, getToken, user } = useAppContext();

  const currency = import.meta.env.VITE_CURRENCY;

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAllBookings = async () => {
    try {
      const {data} = await axios.get('/api/admin/all-bookings', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setBookings(data.bookings);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error)
    }
    setLoading(false);
  };

  useEffect(() => {
    if(user){
    getAllBookings();
    }
  }, [user]);

  return !loading ? (
    <>
    <Title text1="List" text2="Bookings" />
    <div className='max-w-4xl mt-6 overflow-x-auto'>
      <table className='w-full text-left border-collapse rounded-md overflow-hidden text-nowrap'>
        <thead>
          <tr className='bg-primary/20 text-left text-white'>
            <th className='p-2 font-medium pl-5'>User Name</th>
            <th className='p-2 font-medium'>Movie Name</th>
            <th className='p-2 font-medium'>Show Time</th>
            <th className='p-2 font-medium'>Seats</th>
            <th className='p-2 font-medium'>Amount</th>
          </tr>
        </thead>
        <tbody className='text-sm font-light'>
          {bookings.map((booking, index) => (
            <tr key={index} className='border-b border-primary/10 bg-primary/5 even:bg-primary/10'>
              <td className='p-2 min-w-45 pl-5'>{booking.user.name}</td>
              <td className='p-2'>{booking.show.movie.title}</td>
              <td className='p-2'>{dateFormat(booking.show.showDateTime)}</td>
              <td className='p-2'>{Object.keys(booking.bookedSeats).map(seat => booking.bookedSeats[seat]).join(", ")}</td>
              <td className='p-2'> {currency}{booking.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    </>
  ) : <Loading />
}

export default ListBookings