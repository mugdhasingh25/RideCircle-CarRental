import React, { useEffect, useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion } from 'motion/react'

const MyDashboard = () => {
    const { axios, user, currency } = useAppContext()
    const navigate = useNavigate()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchStats = async () => {
        try {
            const { data } = await axios.get('/api/user/renter-stats')
            if (data.success) {
                setStats(data.stats)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user) fetchStats()
    }, [user])

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600'
        if (score >= 50) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getScoreBg = (score) => {
        if (score >= 80) return 'bg-green-50 border-green-200'
        if (score >= 50) return 'bg-yellow-50 border-yellow-200'
        return 'bg-red-50 border-red-200'
    }

    const getScoreLabel = (score) => {
        if (score >= 90) return 'Excellent'
        if (score >= 75) return 'Good'
        if (score >= 50) return 'Average'
        return 'Poor'
    }

    if (loading) return (
        <div className='flex items-center justify-center h-96'>
            <div className='w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin'></div>
        </div>
    )

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='px-6 md:px-16 lg:px-24 xl:px-32 2xl:px-48 mt-16 mb-16 max-w-5xl'
        >
            <h1 className='text-3xl font-bold mb-1'>My Dashboard</h1>
            <p className='text-gray-500 mb-8'>Your rental activity and trust score</p>

            {stats && (
                <>
                    {/* Profile + Score Row */}
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>

                        {/* Profile Card */}
                        <div className='bg-white border border-borderColor rounded-xl p-6 flex items-center gap-4 shadow-sm'>
                            <img
                                src={stats.image || `https://ui-avatars.com/api/?name=${stats.name}&background=random`}
                                alt=""
                                className='w-16 h-16 rounded-full object-cover'
                            />
                            <div>
                                <p className='font-semibold text-gray-800 text-lg'>{stats.name}</p>
                                <p className='text-gray-500 text-sm'>{stats.email}</p>
                                <span className='text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full mt-1 inline-block'>Renter</span>
                            </div>
                        </div>

                        {/* RenterScore Card */}
                        <div className={`border rounded-xl p-6 shadow-sm flex flex-col items-center justify-center ${getScoreBg(stats.renterScore)}`}>
                            <p className='text-sm text-gray-500 mb-1'>RenterScore™</p>
                            <p className={`text-6xl font-bold ${getScoreColor(stats.renterScore)}`}>
                                {stats.renterScore}
                            </p>
                            <p className={`text-sm font-medium mt-1 ${getScoreColor(stats.renterScore)}`}>
                                {getScoreLabel(stats.renterScore)}
                            </p>
                            <p className='text-xs text-gray-400 mt-2 text-center'>
                                Score updates after each completed ride
                            </p>
                        </div>

                        {/* Score Guide */}
                        <div className='bg-white border border-borderColor rounded-xl p-6 shadow-sm'>
                            <p className='text-sm font-medium text-gray-700 mb-3'>Score Guide</p>
                            <div className='space-y-2 text-xs text-gray-500'>
                                <div className='flex justify-between'>
                                    <span>✅ Approved return</span>
                                    <span className='text-green-600 font-medium'>+10 pts</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span>⚠️ Minor damage</span>
                                    <span className='text-yellow-600 font-medium'>-5 pts</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span>🔶 Moderate damage</span>
                                    <span className='text-orange-600 font-medium'>-15 pts</span>
                                </div>
                                <div className='flex justify-between'>
                                    <span>🔴 Major damage</span>
                                    <span className='text-red-600 font-medium'>-30 pts</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
                        {[
                            { label: 'Total Rides', value: stats.totalRides, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Clean Returns', value: stats.approvedRides, color: 'text-green-600', bg: 'bg-green-50' },
                            { label: 'Damage Incidents', value: stats.damageRides, color: 'text-red-600', bg: 'bg-red-50' },
                            { label: 'Pending Bookings', value: stats.pendingBookings, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                        ].map(({ label, value, color, bg }) => (
                            <motion.div
                                key={label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`${bg} rounded-xl p-5 text-center border border-borderColor shadow-sm`}
                            >
                                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                                <p className='text-xs text-gray-500 mt-1'>{label}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Active Booking */}
                    {stats.activeBooking && (
                        <div className='bg-white border border-borderColor rounded-xl p-6 shadow-sm mb-6'>
                            <h2 className='text-lg font-semibold mb-4'>Active Booking</h2>
                            <div className='flex items-center gap-4'>
                                <img
                                    src={stats.activeBooking.car?.image}
                                    alt=""
                                    className='w-24 h-16 object-cover rounded-lg'
                                />
                                <div className='flex-1'>
                                    <p className='font-medium'>{stats.activeBooking.car?.brand} {stats.activeBooking.car?.model}</p>
                                    <p className='text-sm text-gray-500'>
                                        {stats.activeBooking.pickupDate?.split('T')[0]} → {stats.activeBooking.returnDate?.split('T')[0]}
                                    </p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                                        stats.activeBooking.status === 'active' ? 'bg-blue-100 text-blue-600' :
                                        stats.activeBooking.status === 'approved' ? 'bg-green-100 text-green-600' :
                                        'bg-yellow-100 text-yellow-600'
                                    }`}>
                                        {stats.activeBooking.status}
                                    </span>
                                </div>
                                <button
                                    onClick={() => navigate('/my-bookings')}
                                    className='text-sm text-primary hover:underline'
                                >
                                    View →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Quick Links */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <button
                            onClick={() => navigate('/my-bookings')}
                            className='bg-primary text-white py-3 rounded-xl font-medium hover:bg-primary-dull transition'
                        >
                            View All Bookings
                        </button>
                        <button
                            onClick={() => navigate('/cars')}
                            className='border border-primary text-primary py-3 rounded-xl font-medium hover:bg-blue-50 transition'
                        >
                            Browse Cars
                        </button>
                    </div>
                </>
            )}
        </motion.div>
    )
}

export default MyDashboard