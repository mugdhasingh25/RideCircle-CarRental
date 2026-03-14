import React from 'react'
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const Login = () => {

    const {
        setShowLogin,
        axios,
        setToken,
        setUser,
        setIsOwner,
        fetchUser,
        navigate
    } = useAppContext()

    const [state, setState] = React.useState("login");
    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");

    const onSubmitHandler = async (event)=>{
        try {
            event.preventDefault();

            const {data} = await axios.post(
                `/api/user/${state}`,
                {name, email, password}
            )

            if (data.success) {

                // 1️⃣ Store token
                localStorage.setItem('token', data.token)

                // 2️⃣ Update context token
                setToken(data.token)

                // 3️⃣ Set axios header immediately
                axios.defaults.headers.common['Authorization'] = data.token

                // 4️⃣ Load user immediately (THIS FIXES YOUR ISSUE)
                await fetchUser()

                // 5️⃣ Close modal
                setShowLogin(false)

                // 6️⃣ Navigate
                navigate('/')

            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }
    }

  return (
    <div onClick={()=> setShowLogin(false)} className='fixed top-0 bottom-0 left-0 right-0 z-100 flex items-center text-sm text-gray-600 bg-black/50'>

      <form onSubmit={onSubmitHandler} onClick={(e)=>e.stopPropagation()} className="flex flex-col gap-4 m-auto items-start p-8 py-12 w-80 sm:w-[352px] rounded-lg shadow-xl border border-gray-200 bg-white">
            <p className="text-2xl font-medium m-auto">
                <span className="text-primary">User</span> {state === "login" ? "Login" : "Sign Up"}
            </p>

            {state === "register" && (
                <div className="w-full">
                    <p>Name</p>
                    <input 
                        onChange={(e) => setName(e.target.value)} 
                        value={name} 
                        placeholder="type here" 
                        className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary" 
                        type="text" 
                        required 
                    />
                </div>
            )}

            <div className="w-full ">
                <p>Email</p>
                <input 
                    onChange={(e) => setEmail(e.target.value)} 
                    value={email} 
                    placeholder="type here" 
                    className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary" 
                    type="email" 
                    required 
                />
            </div>

            <div className="w-full ">
                <p>Password</p>
                <input 
                    onChange={(e) => setPassword(e.target.value)} 
                    value={password} 
                    placeholder="type here" 
                    className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary" 
                    type="password" 
                    required 
                />
            </div>

            {state === "register" ? (
                <p>
                    Already have account? 
                    <span 
                        onClick={() => setState("login")} 
                        className="text-primary cursor-pointer"
                    >
                        {" "}click here
                    </span>
                </p>
            ) : (
                <p>
                    Create an account? 
                    <span 
                        onClick={() => setState("register")} 
                        className="text-primary cursor-pointer"
                    >
                        {" "}click here
                    </span>
                </p>
            )}

            <button className="bg-primary hover:bg-blue-800 transition-all text-white w-full py-2 rounded-md cursor-pointer">
                {state === "register" ? "Create Account" : "Login"}
            </button>

            <div className="w-full flex items-center gap-2">
                <div className="flex-1 h-px bg-gray-200"></div>
                <p className="text-gray-400 text-xs">or</p>
                <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            <button
                type="button"
                onClick={() => window.location.href = `${import.meta.env.VITE_SERVER_URL}/api/auth/google`}
                className="flex items-center justify-center gap-3 w-full border border-gray-300 rounded-md py-2 hover:bg-gray-50 transition-all cursor-pointer"
            >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                <span className="text-gray-600 font-medium text-sm">Continue with Google</span>
            </button>

        </form>
    </div>
  )
}

export default Login