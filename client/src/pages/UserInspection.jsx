import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAppContext } from "../context/AppContext"
import toast from "react-hot-toast"
import imageCompression from "browser-image-compression"

const UserInspection = () => {

  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { axios } = useAppContext()

  const [booking, setBooking] = useState(null)
  const [images, setImages] = useState({ front: null, rear: null, left: null, right: null })
  const [preview, setPreview] = useState({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const loadingMessages = [
    "Uploading images securely...",
    "Initializing AI damage detection...",
    "Analyzing structural similarity...",
    "Calculating impact severity...",
    "Generating inspection report..."
  ]
  const [loadingStep, setLoadingStep] = useState(0)

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingMessages.length)
      }, 2500)
      return () => clearInterval(interval)
    }
  }, [loading])

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data } = await axios.get('/api/bookings/user')
        if (data.success) {
          const current = data.bookings.find(b => b._id === bookingId)
          if (current) {
            setBooking(current)
            if (current.status === "completed" && current.inspection) {
              setResult({
                overall_status: current.inspection.overall_status,
                overall_damage_ratio: current.inspection.overall_damage_ratio,
                overall_severity_score: current.inspection.overall_severity_score,
                sides: current.inspection.side_results
              })
            }
          }
        }
      } catch (error) {
        toast.error(error.message)
      }
    }
    fetchBooking()
  }, [bookingId])

  const handleFileChange = async (side, file) => {
    const options = { maxSizeMB: 0.4, maxWidthOrHeight: 900, useWebWorker: true }
    const compressed = await imageCompression(file, options)
    setImages(prev => ({ ...prev, [side]: compressed }))
    setPreview(prev => ({ ...prev, [side]: URL.createObjectURL(compressed) }))
  }

  const submitReturnPhotos = async () => {
    if (!images.front || !images.rear || !images.left || !images.right) {
      return toast.error("Please upload all 4 photos")
    }
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append("bookingId", bookingId)
      formData.append("front", images.front)
      formData.append("rear", images.rear)
      formData.append("left", images.left)
      formData.append("right", images.right)

      const { data } = await axios.post(
        "/api/bookings/submit-return",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      )

      if (data.success) {
        toast.success("Return photos submitted! Waiting for owner to confirm.")
        navigate("/my-bookings")
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setLoading(false)
  }

  if (!booking) return <div className="p-10 text-center text-gray-500">Loading...</div>

  return (
    <div className="p-10 max-w-4xl mx-auto">

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 text-white">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-6"/>
          <p className="text-lg font-medium">{loadingMessages[loadingStep]}</p>
        </div>
      )}

      {/* View Report Mode */}
      {result ? (
        <div className="bg-white shadow-md rounded-xl p-8">

          <div className="mt-4 space-y-10">

            <div className="text-center space-y-4">
              <p className="text-sm text-gray-500 tracking-wide">
                RideCircle TrustShield Inspection Report
              </p>
              <div className={`inline-block px-8 py-3 rounded-full text-lg font-bold shadow-md ${
                result.overall_status === "APPROVED"
                  ? "bg-green-100 text-green-700"
                  : result.overall_status === "MINOR DAMAGE"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              }`}>
                {result.overall_status}
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border shadow-sm">
              <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
                <span>Overall Severity</span>
                <span>{Math.round(result.overall_severity_score * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    result.overall_status === "APPROVED"
                      ? "bg-green-500"
                      : result.overall_status === "MINOR DAMAGE"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${result.overall_severity_score * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border rounded-xl p-5 shadow-sm text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Severity Score</p>
                <p className="text-2xl font-bold mt-2">{result.overall_severity_score}</p>
              </div>
              <div className="bg-white border rounded-xl p-5 shadow-sm text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Damage Ratio</p>
                <p className="text-2xl font-bold mt-2">{result.overall_damage_ratio}</p>
              </div>
              <div className="bg-white border rounded-xl p-5 shadow-sm text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Structural Similarity (SSIM)</p>
                <p className="text-2xl font-bold mt-2">{result.overall_ssim ?? 0}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6 text-gray-700">Detailed View Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(result.sides).map(([side, data]) => (
                  <div key={side} className={`p-6 rounded-xl border shadow-sm ${
                    data.status === "CLEAR" ? "bg-green-50 border-green-200"
                    : data.status === "MINOR DAMAGE" ? "bg-yellow-50 border-yellow-200"
                    : "bg-red-50 border-red-200"
                  }`}>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-md font-semibold capitalize">{side} View</h4>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        data.status === "CLEAR" ? "bg-green-200 text-green-800"
                        : data.status === "MINOR DAMAGE" ? "bg-yellow-200 text-yellow-800"
                        : "bg-red-200 text-red-800"
                      }`}>{data.status}</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Damage Count: {data.damage_count}</p>
                      <p>Severity Score: {data.severity_score}</p>
                      <p>Damage Ratio: {data.damage_ratio}</p>
                      <p>SSIM Score: {data.ssim_score}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center pt-6">
              <button
                onClick={() => navigate("/my-bookings")}
                className="bg-primary hover:opacity-90 text-white px-8 py-3 rounded-lg font-medium shadow-md transition"
              >
                Back to My Bookings
              </button>
            </div>

          </div>
        </div>

      ) : (
        /* Upload Return Photos Mode */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Return Car</h2>
            <button onClick={() => navigate("/my-bookings")} className="text-sm text-gray-500 hover:underline">
              ← Back to bookings
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-700 font-medium">
              Please photograph all 4 sides of the car before returning the keys.
              These photos protect you — they prove the condition you returned the car in.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {["front", "rear", "left", "right"].map((side) => (
              <div key={side} className="flex flex-col gap-2">
                <label className="text-sm font-semibold capitalize text-gray-700">
                  {side} view
                </label>
                <label className={`flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
                  preview[side] ? "border-green-400 bg-green-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                }`}>
                  {preview[side] ? (
                    <img src={preview[side]} alt={side} className="h-full w-full object-cover rounded-xl"/>
                  ) : (
                    <div className="text-center text-gray-400">
                      <p className="text-2xl">+</p>
                      <p className="text-xs mt-1">Tap to upload</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={e => e.target.files[0] && handleFileChange(side, e.target.files[0])}
                  />
                </label>
              </div>
            ))}
          </div>

          <button
            onClick={submitReturnPhotos}
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Submit Return Photos
          </button>
        </div>
      )}

    </div>
  )
}

export default UserInspection