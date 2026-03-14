import React, { useEffect, useState } from 'react'
import { assets} from '../assets/assets'
import Title from '../components/Title'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'

const MyBookings = () => {

  const { axios, user, currency } = useAppContext()
  const navigate = useNavigate()

  const [bookings, setBookings] = useState([])
  const [reviewBooking, setReviewBooking] = useState(null)
  const [zoomImage, setZoomImage] = useState(null)

  const fetchMyBookings = async ()=>{
    try {
      const { data } = await axios.get('/api/bookings/user')
      if (data.success){
        setBookings(data.bookings)
      }else{
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleAcceptPickup = async (bookingId) => {
    try {
      const { data } = await axios.post('/api/bookings/accept-pickup', { bookingId })
      if (data.success) {
        toast.success('Ride accepted! Have a safe trip.')
        setReviewBooking(null)
        fetchMyBookings()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(()=>{
    user && fetchMyBookings()
  },[user])

  return (
    <motion.div 
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className='px-6 md:px-16 lg:px-24 xl:px-32 2xl:px-48 mt-16 text-sm max-w-7xl'>

      <Title title='My Bookings'
       subTitle='View and manage your all car bookings'
       align="left"/>

      {/* PHOTO REVIEW MODAL */}
      {reviewBooking && (
        <div className='fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl'>

            <div className='flex justify-between items-center mb-4'>
              <h2 className='text-lg font-semibold'>Review Car Condition</h2>
              <button
                onClick={() => setReviewBooking(null)}
                className='text-gray-400 hover:text-gray-600 text-2xl leading-none'
              >
                ×
              </button>
            </div>

            <p className='text-sm text-gray-500 mb-5'>
              The owner has documented the car in this condition. Please review carefully before accepting the keys. You will be held responsible for any new damage found after the ride.
            </p>

            <div className='grid grid-cols-2 gap-3 mb-6'>
              {['front', 'rear', 'left', 'right'].map(side => (
                <div key={side} className='rounded-lg overflow-hidden border cursor-pointer' onClick={() => setZoomImage(reviewBooking.preInspectionImages[side])}>
                  <img
                    src={reviewBooking.preInspectionImages[side]}
                    alt={side}
                    className='w-full h-36 object-cover hover:opacity-90 transition'
                  />
                  <p className='text-xs text-center text-gray-500 py-1 capitalize'>{side} View 🔍</p>
                </div>
              ))}
            </div>

            <div className='flex gap-3'>
              <button
                onClick={() => setReviewBooking(null)}
                className='flex-1 px-4 py-2 border border-gray-300 text-gray-600 rounded-md text-sm hover:bg-gray-50 transition'
              >
                Cancel
              </button>
              <button
                onClick={() => handleAcceptPickup(reviewBooking._id)}
                className='flex-1 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition'
              >
                ✓ Accept & Take Keys
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ZOOM IMAGE OVERLAY */}
      {zoomImage && (
        <div
          className='fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 cursor-pointer'
          onClick={() => setZoomImage(null)}
        >
          <img src={zoomImage} alt="zoom" className='max-h-screen max-w-full rounded-lg object-contain'/>
          <button className='absolute top-4 right-4 text-white text-3xl'>×</button>
        </div>
      )}

       <div>
        {bookings.map((booking, index)=>{

          const today = new Date()
          const pickup = new Date(booking.pickupDate)
          const returnDate = new Date(booking.returnDate)
          const withinRentalPeriod = today >= pickup && today <= returnDate

          return (
          <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.4 }}
          key={booking._id} className='grid grid-cols-1 md:grid-cols-4 gap-6 p-6 border border-borderColor rounded-lg mt-5 first:mt-12'>

            <div className='md:col-span-1'>
              <div className='rounded-md overflow-hidden mb-3'>
                <img src={booking.car.image} alt="" className='w-full h-auto aspect-video object-cover'/>
              </div>
              <p className='text-lg font-medium mt-2'>{booking.car.brand} {booking.car.model}</p>
              <p className='text-gray-500'>{booking.car.year} • {booking.car.category} • {booking.car.location}</p>
            </div>

            <div className='md:col-span-2'>
              <div className='flex items-center gap-2'>
                <p className='px-3 py-1.5 bg-light rounded'>Booking #{index+1}</p>
                <p className={`px-3 py-1 text-xs rounded-full ${
                  booking.status === 'approved'
                    ? 'bg-green-400/15 text-green-600'
                    : booking.status === 'pending'
                    ? 'bg-yellow-400/15 text-yellow-600'
                    : booking.status === 'cancelled'
                    ? 'bg-red-400/15 text-red-600'
                    : booking.status === 'active'
                    ? 'bg-blue-400/15 text-blue-600'
                    : booking.status === 'returning'
                    ? 'bg-orange-400/15 text-orange-600'
                    : booking.status === 'completed'
                    ? 'bg-purple-400/15 text-purple-600'
                    : 'bg-gray-400/15 text-gray-600'
                }`}>
                  {booking.status}
                </p>
              </div>

              <div className='flex items-start gap-2 mt-3'>
                <img src={assets.calendar_icon_colored} alt="" className='w-4 h-4 mt-1'/>
                <div>
                  <p className='text-gray-500'>Rental Period</p>
                  <p>{booking.pickupDate.split('T')[0]} To {booking.returnDate.split('T')[0]}</p>
                </div>
              </div>

              <div className='flex items-start gap-2 mt-3'>
                <img src={assets.location_icon_colored} alt="" className='w-4 h-4 mt-1'/>
                <div>
                  <p className='text-gray-500'>Pick-up Location</p>
                  <p>{booking.car.location}</p>
                </div>
              </div>
            </div>

           <div className='md:col-span-1 flex flex-col justify-between gap-6'>
              <div className='text-sm text-gray-500 text-right'>
                <p>Total Price</p>
                <h1 className='text-2xl font-semibold text-primary'>{currency}{booking.price}</h1>
                <p>Booked on {booking.createdAt.split('T')[0]}</p>
              </div>

              <div className='flex flex-col gap-2'>

                {booking.status === 'approved' && booking.preInspectionImages?.front && withinRentalPeriod && (
                  <button
                    onClick={() => setReviewBooking(booking)}
                    className='w-full px-4 py-2 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors'
                  >
                    Review & Accept Keys
                  </button>
                )}

                {booking.status === 'approved' && !booking.preInspectionImages?.front && withinRentalPeriod && (
                  <p className='text-xs text-yellow-600 bg-yellow-50 px-3 py-2 rounded-md text-right'>
                    Waiting for owner to document the car.
                  </p>
                )}

                {booking.status === 'active' && (
                  <button
                    onClick={() => navigate(`/inspection/${booking._id}`)}
                    className='w-full px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors'
                  >
                    Return Car
                  </button>
                )}

                {booking.status === 'returning' && (
                  <p className='text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-md text-right'>
                    Return submitted. Waiting for owner to confirm.
                  </p>
                )}

                {booking.status === 'completed' && booking.inspection && (
                  <button
                    onClick={() => navigate(`/inspection/${booking._id}`)}
                    className='w-full px-4 py-2 bg-purple-600 text-white rounded-md text-xs font-medium hover:bg-purple-700 transition-colors'
                  >
                    View Report
                  </button>
                )}

              </div>
           </div>

          </motion.div>
          )
        })}
       </div>
      
    </motion.div>
  )
}

export default MyBookings