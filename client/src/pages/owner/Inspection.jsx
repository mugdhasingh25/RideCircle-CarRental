import React, { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAppContext } from "../../context/AppContext"
import toast from "react-hot-toast"
import imageCompression from "browser-image-compression"

const Inspection = () => {

  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { axios } = useAppContext()

  const [booking, setBooking] = useState(null)
  const [mode, setMode] = useState("pre")
  const [images, setImages] = useState({
    front: null,
    rear: null,
    left: null,
    right: null
  })
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

  // Rotate loading messages ONLY for post-ride AI inspection
  useEffect(() => {
    if (loading && mode === "post") {
      const interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingMessages.length)
      }, 2500)
      return () => clearInterval(interval)
    }
  }, [loading, mode])

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data } = await axios.get('/api/bookings/owner')
        if (data.success) {
          const current = data.bookings.find(b => b._id === bookingId)
          if (current) {
            setBooking(current)

            if (current.status === "completed" && current.inspection) {
              setResult({
                overall_status: current.inspection.overall_status,
                overall_damage_ratio: current.inspection.overall_damage_ratio,
                overall_severity_score: current.inspection.overall_severity_score,
                overall_ssim: 0,
                sides: current.inspection.side_results
              })
            } else {
              setMode(current.status === "active" ? "post" : "pre")
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
    const options = {
      maxSizeMB: 0.4,
      maxWidthOrHeight: 900,
      useWebWorker: true
    }

    const compressed = await imageCompression(file, options)
    
    setImages(prev => ({ ...prev, [side]: compressed }))
    setPreview(prev => ({ ...prev, [side]: URL.createObjectURL(compressed) }))
  }

  const runInspection = async () => {

    if (!images.front || !images.rear || !images.left || !images.right) {
      return toast.error("Upload all 4 images")
    }

    try {

      setLoading(true)

      const formData = new FormData()
      formData.append("bookingId", bookingId)
      formData.append("front", images.front)
      formData.append("rear", images.rear)
      formData.append("left", images.left)
      formData.append("right", images.right)

      if (mode === "pre") {

        const { data } = await axios.post(
          "/api/bookings/start-ride",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        )

        if (data.success) {
          toast.success("Ride Started Successfully")
          navigate("/owner/manage-bookings")
        } else {
          toast.error(data.message)
        }

      } else {

        const { data } = await axios.post(
          "/api/bookings/end-ride",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        )

        if (data.success) {
          setResult(data.inspection)
        } else {
          toast.error(data.message)
        }
      }

    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }

    setLoading(false)
  }

  return (
    <div className="p-10 max-w-4xl mx-auto">

      {/* FULL AI OVERLAY (ONLY POST MODE) */}
      {loading && mode === "post" && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 text-white">

          <div className="relative mb-10">
            <div className="w-44 h-44 border-4 border-blue-400 rounded-full animate-ping opacity-20 absolute"></div>
            <div className="w-44 h-44 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold tracking-widest">
              AI
            </div>
          </div>

          <p className="text-2xl font-semibold mb-4">
            TrustShield AI Processing
          </p>

          <p className="text-sm text-gray-300 mb-6 animate-pulse">
            {loadingMessages[loadingStep]}
          </p>

          <div className="w-80 bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-1000"
              style={{ width: `${(loadingStep + 1) * 20}%` }}
            />
          </div>

        </div>
      )}

      <div className="bg-white shadow-md rounded-xl p-8">

        <h2 className="text-2xl font-semibold mb-2">
          {mode === "pre" ? "AI Pre-Ride Inspection" : "AI Post-Ride Inspection"}
        </h2>

        <p className="text-gray-500 mb-6">
          {mode === "pre"
            ? "Upload car images before starting the ride."
            : "Upload car images after ride completion for damage analysis."}
        </p>

        {!result && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {["front","rear","left","right"].map(side => (
                <div key={side} className="border rounded-lg p-4 text-center">

                  <p className="mb-3 capitalize font-medium">
                    {side} View
                  </p>

                  {preview[side] ? (
                    <img
                      src={preview[side]}
                      alt=""
                      className="h-40 w-full object-cover rounded-md mb-3"
                    />
                  ) : (
                    <div className="h-40 flex items-center justify-center bg-gray-100 rounded-md mb-3 border border-dashed text-gray-400 text-sm">
                      Upload Image
                    </div>
                  )}

                  <label className="cursor-pointer inline-block bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium px-4 py-2 rounded-md transition">
                    Upload {side}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e)=> handleFileChange(side, e.target.files[0])}
                    />
                  </label>

                </div>
              ))}
            </div>

            <button
              onClick={runInspection}
              disabled={loading}
              className="mt-8 w-full bg-blue-600 hover:bg-blue-700 transition text-white py-3 rounded-lg font-medium"
            >
              {loading ? (
                mode === "pre" ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Starting Ride...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                        AI
                      </div>
                    </div>

                    <p className="text-white text-sm animate-pulse">
                      {loadingMessages[loadingStep]}
                    </p>

                    <div className="w-full bg-blue-400 bg-opacity-30 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-1000"
                        style={{ width: `${(loadingStep + 1) * 20}%` }}
                      />
                    </div>
                  </div>
                )
              ) : (
                mode === "pre"
                  ? "Start Ride"
                  : "Run AI Inspection"
              )}
            </button>
          </>
        )}

        {result && (
          <div className="mt-12 space-y-10">

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
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Severity Score
                </p>
                <p className="text-2xl font-bold mt-2">
                  {result.overall_severity_score}
                </p>
              </div>

              <div className="bg-white border rounded-xl p-5 shadow-sm text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Damage Ratio
                </p>
                <p className="text-2xl font-bold mt-2">
                  {result.overall_damage_ratio}
                </p>
              </div>

              <div className="bg-white border rounded-xl p-5 shadow-sm text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Structural Similarity (SSIM)
                </p>
                <p className="text-2xl font-bold mt-2">
                  {result.overall_ssim}
                </p>
              </div>

            </div>

            <div>
              <h3 className="text-lg font-semibold mb-6 text-gray-700">
                Detailed View Analysis
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(result.sides).map(([side, data]) => (
                  <div
                    key={side}
                    className={`p-6 rounded-xl border shadow-sm ${
                      data.status === "CLEAR"
                        ? "bg-green-50 border-green-200"
                        : data.status === "MINOR DAMAGE"
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-red-50 border-red-200"
                    }`}
                  >

                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-md font-semibold capitalize">
                        {side} View
                      </h4>

                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        data.status === "CLEAR"
                          ? "bg-green-200 text-green-800"
                          : data.status === "MINOR DAMAGE"
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-red-200 text-red-800"
                      }`}>
                        {data.status}
                      </span>
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
                onClick={()=> navigate("/owner/manage-bookings")}
                className="bg-primary hover:opacity-90 text-white px-8 py-3 rounded-lg font-medium shadow-md transition"
              >
                Back to Manage Bookings
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  )
}

export default Inspection
