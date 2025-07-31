import { ShoppingCart, UserPlus, LogIn, LogOut, Lock } from "lucide-react";
import { Link } from "react-router-dom"; 
import { useUserStore } from "../stores/useUserStore";   
import { useCartStore } from "../stores/useCartStore";

const Navbar = () => {
    const isDisabled = false;
    const {user, logout} = useUserStore();
    const isAdmin = user?.role === "admin";
    const {cart} = useCartStore();
    const phoneNumber = 254713440774
    const encodedMessage = "Hello! 👋 I'm excited that you're interested in my beautiful bracelets! 🧡✨ How can I assist you today? Feel free to ask about our designs, customization options, pricing, or anything else. I'm here to get you your confidence! 😊"
  return (

    <header className="fixed top-0 left-0 w-full bg-gray-900 bg-opacity-90 backdrop-blur-md shadow-lg z-40 transition-all duration-300 border-b border-emerald-800">

        <div className="container mx-auto px-4 py-3">
            <div className="flex flex-wrap justify-between items-center">
            <Link to={'/'} className="text-2xl font-bold text-emerald-400 items-center space-x-z flex">
             OpenCart
            </Link>
            <a 
      href={`https://wa.me/${phoneNumber}?text=${encodedMessage}`} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-green-500 hover:text-green-700"
    >
      +254713 440 774
    </a>

            <nav className="flex flex-wrap items-center gap-4">
                <Link to={'/'} className="text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out">
                Home
                </Link>
                <Link to={'/orders'} className="text-gray-300 hover:text-emerald-400 transition duration-300 ease-in-out">
                My Orders
                </Link>
                {user &&(
                    
                    <Link to={"/cart"} /*className="relative group" */
                    className={`relative group ${cart.length === 0 ? 'pointer-events-none opacity-50' : ''}`} 
                    aria-disabled={cart.length === 0 ? "true" : "false"}
                    >
                    <ShoppingCart className="inline-block mr-1 group-hover:text-emerald-400" size={20}/>
                        <span className="hidden sm:inline">Cart</span>
                        {cart.length > 0 && <span className="absolute -top-2 -left-2 bg-emerald-500 text-white rounded-full px-2 py-0.5 text-xs group-hover:bg-emerald-400 transition duration 300 ease-in-out ">
                            {cart.length}
                        </span>} 
                    </Link>
                )}

                {isAdmin &&(
                    <Link className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded-md font-medium transition duration-300 ease-in-out flex items-center" 
                    to="/secret-dashboard">
                        <Lock className="inline-block mr-1" size={18} />
                        <span className="hidden sm:inline">Dashboard</span>
                    </Link>
                )}

                {user ? (
                    <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out" onClick={logout}>
                        <LogOut size={18} />
                        <span className="hidden sm:inline ml-2">Log Out</span>
                    </button>
                ) : (
                    <>
                        <Link to={isDisabled ? "#" : "/signup"}  // Redirect to "#" when disabled
                        className={`bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={isDisabled ? (e) => e.preventDefault() : null}  // Prevent action if disabled
                        >
                        <UserPlus className="mr-2" size={18} />
                        Sign Up
                        </Link>

                        <Link to={isDisabled ? "#" : "/login"}  // Redirect to "#" when disabled
                        className={`bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center transition duration-300 ease-in-out ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                         onClick={isDisabled ? (e) => e.preventDefault() : null}  // Prevent action if disabled
                        >
                        <UserPlus className="mr-2" size={18} />
                        login
                        </Link>
                    </>
                )}

            </nav>
            </div>

        </div>

    </header>
  )
}

export default Navbar
