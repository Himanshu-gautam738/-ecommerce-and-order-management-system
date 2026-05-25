import { useCart } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";

function CartPage() {
    const { cartItems, total, updateQuantity, removeFromCart, clearCart } = useCart();
    const navigate = useNavigate();
    const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty!</h2>
                <Link to="/" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                    Go Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-center mb-6">Shopping Cart</h1>
            <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
                {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-4 mb-4">
                        <div className="flex items-center gap-4">
                            <img src={`${BASEURL}${item.product_image}`} alt={item.product_name} className="w-20 h-20 object-cover rounded" />
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">{item.product_name}</h2>
                                <p className="text-gray-600">₹{item.product_price}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-3 py-1 bg-gray-200 rounded">-</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-3 py-1 bg-gray-200 rounded">+</button>
                            <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 ml-4">Remove</button>
                        </div>
                    </div>
                ))}
                <div className="flex justify-between items-center mt-6">
                    <h2 className="text-2xl font-bold">Total: ${total}</h2>
                    <div className="flex gap-4">
                        <button onClick={clearCart} className="text-gray-600 hover:text-gray-800">Clear Cart</button>
                        <button onClick={() => navigate('/checkout')} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CartPage;