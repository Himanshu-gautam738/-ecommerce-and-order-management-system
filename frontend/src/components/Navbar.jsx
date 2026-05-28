import {Link, useNavigate} from 'react-router-dom';
import {useCart} from '../context/CartContext.jsx';
import { clearTokens, getAccessToken } from '../utils/auth.js';

function Navbar() {
    const {cartItems, clearCart} = useCart();
    const navigate = useNavigate();
    
    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
    
    const isLoggedIn = !!getAccessToken();

    const handleLogout = () => {
        clearTokens();
        clearCart();
        navigate('/login');
    };
    const username = localStorage.getItem("username") || "User";

    return (
        <nav className='bg-white shadow-md px-6 py-4 flex justify-between items-center fixed w-full top-0 z-50'>
            <Link to='/' className='text-2xl font-bold text-gray-800 flex items-center'>
                🛒 KART
            </Link>

            <div className='flex items-center gap-6'>
                <Link to='/' className='text-gray-800 hover:text-gray-600 font-medium'>
                    Home
                </Link>
                <Link to='/' className='text-gray-800 hover:text-gray-600 font-medium'>
                    Products
                </Link>
                {isLoggedIn && (
                    <Link to='/orders' className='text-gray-800 hover:text-gray-600 font-medium'>
                        Orders
                    </Link>
                )}

                {isLoggedIn && (
                    <span className='text-gray-800 font-medium'>
                        Hello, {username}
                    </span>
                )}

                <Link to='/cart' className='relative text-gray-800 hover:text-gray-600 font-medium flex items-center'>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    </svg>
                    {cartCount > 0 && (
                        <span className='absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold rounded-full px-2'>
                            {cartCount}
                        </span>
                    )}
                </Link>

                {!isLoggedIn ? (
                    <>
                        <Link to='/login' className='bg-pink-600 text-white px-4 py-2 rounded-md font-medium hover:bg-pink-700 transition'>
                            Login
                        </Link>
                    </>
                ) : (
                    <button onClick={handleLogout} className='bg-pink-600 text-white px-4 py-2 rounded-md font-medium hover:bg-pink-700 transition'>
                        Logout
                    </button>
                )}
            </div>
        </nav>
    )
}

export default Navbar;