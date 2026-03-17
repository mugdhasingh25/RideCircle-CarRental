import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { assets } from '../assets/assets'
import Loader from '../components/Loader'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { motion } from 'motion/react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

// Payment Form Component
const PaymentForm = ({ booking, car, onSuccess, onCancel }) => {
    const stripe = useStripe()
    const elements = useElements()
    const { axios, currency } = useAppContext()
    const [processing, setProcessing] = useState(false)
    const [paymentInfo, setPaymentInfo] = useState(null)

    useEffect(() => {
        const getPaymentIntent = async () => {
            const { data } = await axios.post('/api/payment/create-payment-intent', {
                bookingId: booking._id
            })
            if (data.success) {
                setPaymentInfo(data)
            }
        }
        getPaymentIntent()
    }, [booking])

    const handlePayment = async (e) => {
        e.preventDefault()
        if (!stripe || !elements || !paymentInfo) return

        setProcessing(true)

        const result = await stripe.confirmCardPayment(paymentInfo.clientSecret, {
            payment_method: {
                card: elements.getElement(CardElement),
            }
        })

        if (result.error) {
            toast.error(result.error.message)
            setProcessing(false)
        } else if (result.paymentIntent.status === 'succeeded') {
            const { data } = await axios.post('/api/payment/confirm-payment', {
                bookingId: booking._id,
                paymentIntentId: result.paymentIntent.id
            })
            if (data.success) {
                onSuccess()
            }
        }
    }

    return (
        <div className='fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4'>
            <div className='bg-white rounded-xl max-w-md w-full p-6 shadow-2xl'>
                <div className='flex justify-between items-center mb-6'>
                    <h2 className='text-lg font-semibold'>Complete Payment</h2>
                    <button onClick={onCancel} className='text-gray-400 hover:text-gray-600 text-2xl'>×</button>
                </div>

                {/* Booking Summary */}
                <div className='bg-gray-50 rounded-lg p-4 mb-6 space-y-2'>
                    <div className='flex justify-between text-sm text-gray-600'>
                        <span>Rental Amount</span>
                        <span>{currency}{paymentInfo?.bookingPrice || 0}</span>
                    </div>
                    {paymentInfo?.securityDeposit > 0 && (
                        <div className='flex justify-between text-sm text-gray-600'>
                            <span>Security Deposit (Refundable)</span>
                            <span>{currency}{paymentInfo?.securityDeposit}</span>
                        </div>
                    )}
                    <div className='flex justify-between text-sm font-semibold text-gray-800 border-t pt-2'>
                        <span>Total</span>
                        <span>{currency}{paymentInfo?.totalAmount || 0}</span>
                    </div>
                    {paymentInfo?.securityDeposit > 0 && (
                        <p className='text-xs text-green-600'>
                            ✓ Security deposit of {currency}{paymentInfo?.securityDeposit} will be refunded after approved inspection
                        </p>
                    )}
                </div>

                {/* Card Input */}
                <form onSubmit={handlePayment} className='space-y-4'>
                    <div className='border border-gray-200 rounded-lg p-3'>
                        <CardElement options={{
                            style: {
                                base: {
                                    fontSize: '16px',
                                    color: '#424770',
                                    '::placeholder': { color: '#aab7c4' }
                                }
                            }
                        }}/>
                    </div>

                    <p className='text-xs text-gray-400 text-center'>
                        Test card: 4000 0035 6008 0010 | Any future date | Any CVV | OTP: any
                    </p>

                    <button
                        type='submit'
                        disabled={!stripe || processing}
                        className='w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-dull transition disabled:opacity-60'
                    >
                        {processing ? (
                            <div className='flex items-center justify-center gap-2'>
                                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                                Processing...
                            </div>
                        ) : `Pay ${currency}${paymentInfo?.totalAmount || 0}`}
                    </button>
                </form>
            </div>
        </div>
    )
}

const CarDetails = () => {
    const { id } = useParams()
    const { cars, axios, pickupDate, setPickupDate, returnDate, setReturnDate, user } = useAppContext()
    const navigate = useNavigate()
    const [car, setCar] = useState(null)
    const [showPayment, setShowPayment] = useState(false)
    const [pendingBooking, setPendingBooking] = useState(null)
    const currency = import.meta.env.VITE_CURRENCY

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!user) {
            return toast.error("Please login to book a car")
        }
        try {
            const { data } = await axios.post('/api/bookings/create', {
                car: id,
                pickupDate,
                returnDate
            })

            if (data.success) {
                setPendingBooking(data.booking)
                setShowPayment(true)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const handlePaymentSuccess = () => {
        setShowPayment(false)
        toast.success("Booking confirmed! Payment successful.")
        navigate('/my-bookings')
    }

    const handlePaymentCancel = () => {
        setShowPayment(false)
        setPendingBooking(null)
    }

    useEffect(() => {
        setCar(cars.find(car => car._id === id))
    }, [cars, id])

    const noOfDays = pickupDate && returnDate
        ? Math.ceil((new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24))
        : 0

    const rentalAmount = noOfDays * (car?.pricePerDay || 0)
    const securityDeposit = car?.securityDeposit || 0
    const totalAmount = rentalAmount + securityDeposit

    return car ? (
        <div className='px-6 md:px-16 lg:px-24 xl:px-32 mt-16'>

            {showPayment && pendingBooking && (
                <Elements stripe={stripePromise}>
                    <PaymentForm
                        booking={pendingBooking}
                        car={car}
                        onSuccess={handlePaymentSuccess}
                        onCancel={handlePaymentCancel}
                    />
                </Elements>
            )}

            <button onClick={() => navigate(-1)} className='flex items-center gap-2 mb-6 text-gray-500 cursor-pointer'>
                <img src={assets.arrow_icon} alt="" className='rotate-180 opacity-65' />
                Back to all cars
            </button>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12'>
                {/* Left: Car Image & Details */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className='lg:col-span-2'>
                    <motion.img
                        initial={{ scale: 0.98, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        src={car.image} alt="" className='w-full h-auto md:max-h-100 object-cover rounded-xl mb-6 shadow-md' />
                    <motion.div className='space-y-6'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}>
                        <div>
                            <h1 className='text-3xl font-bold'>{car.brand} {car.model}</h1>
                            <p className='text-gray-500 text-lg'>{car.category} • {car.year}</p>
                        </div>
                        <hr className='border-borderColor my-6' />

                        <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
                            {[
                                { icon: assets.users_icon, text: `${car.seating_capacity} Seats` },
                                { icon: assets.fuel_icon, text: car.fuel_type },
                                { icon: assets.car_icon, text: car.transmission },
                                { icon: assets.location_icon, text: car.location },
                            ].map(({ icon, text }) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                    key={text} className='flex flex-col items-center bg-light p-4 rounded-lg'>
                                    <img src={icon} alt="" className='h-5 mb-2' />
                                    {text}
                                </motion.div>
                            ))}
                        </div>

                        {/* Description */}
                        <div>
                            <h1 className='text-xl font-medium mb-3'>Description</h1>
                            <p className='text-gray-500'>{car.description}</p>
                        </div>

                        {/* Features */}
                        <div>
                            <h1 className='text-xl font-medium mb-3'>Features</h1>
                            <ul className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                                {["360 Camera", "Bluetooth", "GPS", "Heated Seats", "Rear View Mirror"].map((item) => (
                                    <li key={item} className='flex items-center text-gray-500'>
                                        <img src={assets.check_icon} className='h-4 mr-2' alt="" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Right: Booking Form */}
                <motion.form
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    onSubmit={handleSubmit}
                    className='shadow-lg h-max sticky top-18 rounded-xl p-6 space-y-4 text-gray-500'>

                    <p className='flex items-center justify-between text-2xl text-gray-800 font-semibold'>
                        {currency}{car.pricePerDay}
                        <span className='text-base text-gray-400 font-normal'>per day</span>
                    </p>

                    <hr className='border-borderColor' />

                    <div className='flex flex-col gap-2'>
                        <label htmlFor="pickup-date">Pickup Date</label>
                        <input value={pickupDate} onChange={(e) => setPickupDate(e.target.value)}
                            type="date" className='border border-borderColor px-3 py-2 rounded-lg' required id='pickup-date'
                            min={new Date().toISOString().split('T')[0]} />
                    </div>

                    <div className='flex flex-col gap-2'>
                        <label htmlFor="return-date">Return Date</label>
                        <input value={returnDate} onChange={(e) => setReturnDate(e.target.value)}
                            type="date" className='border border-borderColor px-3 py-2 rounded-lg' required id='return-date' />
                    </div>

                    {/* Price Breakdown */}
                    {noOfDays > 0 && (
                        <div className='bg-gray-50 rounded-lg p-3 space-y-2 text-sm'>
                            <div className='flex justify-between'>
                                <span>{currency}{car.pricePerDay} × {noOfDays} days</span>
                                <span>{currency}{rentalAmount}</span>
                            </div>
                            {securityDeposit > 0 && (
                                <div className='flex justify-between text-green-600'>
                                    <span>Security Deposit (Refundable)</span>
                                    <span>{currency}{securityDeposit}</span>
                                </div>
                            )}
                            <div className='flex justify-between font-semibold text-gray-800 border-t pt-2'>
                                <span>Total</span>
                                <span>{currency}{totalAmount}</span>
                            </div>
                        </div>
                    )}

                    {/* Security Deposit Info */}
                    {securityDeposit > 0 && (
                        <div className='flex items-start gap-2 bg-blue-50 p-3 rounded-lg text-xs text-blue-700'>
                            <span>🛡️</span>
                            <p>A refundable security deposit of {currency}{securityDeposit} is collected. It will be released after a clean inspection report.</p>
                        </div>
                    )}

                    <button className='w-full bg-primary hover:bg-primary-dull transition-all py-3 font-medium text-white rounded-xl cursor-pointer'>
                        Book Now
                    </button>

                    <p className='text-center text-xs text-gray-400'>Secure payment powered by Stripe</p>
                </motion.form>
            </div>
        </div>
    ) : <Loader />
}

export default CarDetails