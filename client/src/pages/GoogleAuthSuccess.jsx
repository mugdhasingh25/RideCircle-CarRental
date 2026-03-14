import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAppContext } from "../context/AppContext"

const GoogleAuthSuccess = () => {
    const navigate = useNavigate()
    const { setToken, axios, setUser, setIsOwner } = useAppContext()

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const token = params.get("token")

        console.log("GoogleAuthSuccess loaded")
        console.log("Token from URL:", token)

        if (token) {
            localStorage.setItem("token", token)
            axios.defaults.headers.common['Authorization'] = token
            setToken(token)

            axios.get('/api/user/data').then(({ data }) => {
                console.log("fetchUser response:", data)
                if (data.success) {
                    setUser(data.user)
                    setIsOwner(data.user.role === 'owner')
                    navigate("/")
                } else {
                    console.log("fetchUser failed:", data.message)
                    navigate("/")
                }
            }).catch(err => {
                console.log("fetchUser error:", err.message)
                navigate("/")
            })

        } else {
            console.log("No token found in URL")
            navigate("/login")
        }
    }, [])

    return (
        <div className="flex items-center justify-center h-screen">
            <p className="text-gray-500 text-lg">Signing you in with Google...</p>
        </div>
    )
}

export default GoogleAuthSuccess