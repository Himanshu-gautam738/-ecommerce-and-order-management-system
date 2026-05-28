import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

function VerifyEmail() {
  const { token } = useParams();
  const BASE = import.meta.env.VITE_DJANGO_BASE_URL;
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`${BASE}/api/verify-email/${token}/`);
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMsg(data.message || "Email verified successfully!");
          
          // Automatically redirect to login page after a brief delay
          setTimeout(() => {
            navigate("/login", { 
              state: { message: data.message || "Email verified successfully! You can now login." } 
            });
          }, 1200);
        } else {
          setStatus("error");
          setMsg(data.error || "Invalid or expired verification link.");
        }
      } catch (err) {
        console.error(err);
        setStatus("error");
        setMsg("Verification failed. Please try again.");
      }
    };

    verify();
  }, [token, BASE, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        {status === "loading" && (
          <>
            <div className="text-6xl mb-4 animate-spin">⏳</div>
            <h2 className="text-2xl font-bold mb-3 text-gray-800">Verifying your email...</h2>
            <p className="text-gray-500">Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-3 text-green-600">Email Verified!</h2>
            <p className="text-gray-600 mb-6">{msg}</p>
            <Link
              to="/login"
              className="inline-block bg-pink-600 text-white px-6 py-2 rounded-md font-medium hover:bg-pink-700 transition"
            >
              Go to Login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold mb-3 text-red-600">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{msg}</p>
            <Link
              to="/signup"
              className="inline-block bg-pink-600 text-white px-6 py-2 rounded-md font-medium hover:bg-pink-700 transition"
            >
              Try Signing Up Again
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
