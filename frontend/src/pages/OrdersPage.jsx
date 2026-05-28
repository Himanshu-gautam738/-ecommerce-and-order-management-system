import { useEffect, useState } from "react";
import { authFetch } from "../utils/auth";
import { Link } from "react-router-dom";

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const BASEURL = import.meta.env.VITE_DJANGO_BASE_URL;

  const fetchOrders = async () => {
    try {
      const res = await authFetch(`${BASEURL}/api/orders/`);
      if (!res.ok) {
        throw new Error("Failed to fetch your orders history");
      }
      const data = await res.json();
      setOrders(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [BASEURL]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Bhai, kya aap sach me ye order cancel karna chahte hain?")) {
      return;
    }
    try {
      const res = await authFetch(`${BASEURL}/api/orders/${orderId}/cancel/`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        alert("Order cancelled successfully!");
        setOrders((prevOrders) =>
          prevOrders.map((o) =>
            o.id === orderId ? { ...o, payment_status: "Cancelled" } : o
          )
        );
      } else {
        alert(data.error || "Failed to cancel order");
      }
    } catch (err) {
      alert("Error cancelling order: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Fetching your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center pt-20 p-4">
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl max-w-md text-center shadow-sm border border-red-100">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-red-500 mb-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-sm mb-4">{error}</p>
          <Link to="/" className="bg-red-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-red-700 transition">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Order History</h1>
            <p className="text-gray-500 text-sm mt-1">View and track all your previous purchases</p>
          </div>
          <Link to="/" className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-gray-50 transition flex items-center gap-2">
            &larr; Continue Shopping
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100 flex flex-col items-center">
            <div className="bg-pink-50 p-4 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-pink-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No orders placed yet</h2>
            <p className="text-gray-500 max-w-sm mb-6">Looks like you haven't made any purchases yet. Head over to our catalog and buy your favorite item!</p>
            <Link to="/" className="bg-pink-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-pink-700 transition shadow-md shadow-pink-100">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:border-gray-200 transition-all">
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-gray-100">
                  <div className="flex gap-6 flex-wrap">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Order ID</p>
                      <p className="text-sm font-bold text-gray-800">#SVX-2026-{order.id}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Date Placed</p>
                      <p className="text-sm font-medium text-gray-700">
                        {new Date(order.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment Method</p>
                      <p className="text-sm font-medium text-gray-700">
                        {order.payment_method === "COD" ? "Cash on Delivery" : "Online Payment"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full ${
                      order.payment_status === "Paid"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : order.payment_status === "Failed"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : order.payment_status === "Cancelled"
                        ? "bg-gray-50 text-gray-500 border border-gray-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      {order.payment_status === "Paid" ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          Paid
                        </>
                      ) : order.payment_status === "Failed" ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Failed
                        </>
                      ) : order.payment_status === "Cancelled" ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Cancelled
                        </>
                      ) : (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                          Pending
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-gray-100 px-6">
                  {order.items && order.items.map((item) => (
                    <div key={item.id} className="py-4 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4">
                        <img
                          src={`${BASEURL}${item.product_image}`}
                          alt={item.product_name}
                          className="w-16 h-16 object-cover rounded-xl border border-gray-100 bg-gray-50 flex-shrink-0"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-800 text-base">{item.product_name}</h3>
                          <p className="text-gray-400 text-sm mt-0.5">Quantity: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-base">₹{item.price * item.quantity}</p>
                        <p className="text-gray-400 text-xs mt-0.5">₹{item.price} each</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="bg-gray-50/50 px-6 py-4 flex justify-between items-center border-t border-gray-100 flex-wrap gap-4">
                  <div className="flex items-center gap-6">
                    <span className="text-gray-500 font-medium text-sm">Grand Total</span>
                    <span className="text-xl font-extrabold text-pink-600">₹{order.total_amount}</span>
                  </div>

                  {order.payment_status !== "Cancelled" && order.payment_status !== "Failed" && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="bg-red-50 text-red-600 hover:bg-red-100 font-semibold px-4 py-2 rounded-xl transition border border-red-200 text-sm shadow-sm"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersPage;
