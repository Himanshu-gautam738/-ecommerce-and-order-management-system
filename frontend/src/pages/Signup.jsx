import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

function Signup() {
  const BASE = import.meta.env.VITE_DJANGO_BASE_URL;
  const [form, setForm] = useState({ username: "", email: "", password: "", password2: "" });
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [registeredUsername, setRegisteredUsername] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const cancelled = searchParams.get("cancelled");
    const error = searchParams.get("error");
    if (cancelled === "true") {
      setMsg("❌ Registration cancelled! Your account registration details have been removed.");
      setSuccess(false);
      setSearchParams({}, { replace: true });
    } else if (error === "invalid_token") {
      setMsg("❌ Invalid or expired verification/cancellation link.");
      setSuccess(false);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!success || !registeredUsername) return;

    // Polling function to check if user has been verified (in case they verify via email click)
    const checkVerificationStatus = async () => {
      try {
        const res = await fetch(`${BASE}/api/check-verification-status/${registeredUsername}/`);
        if (res.ok) {
          const data = await res.json();
          if (data.is_active) {
            // Once verified, show a clean alert and redirect!
            alert("Registration successful!");
            navigate("/login");
          }
        }
      } catch (err) {
        console.error("Error polling verification status:", err);
      }
    };

    const intervalId = setInterval(checkVerificationStatus, 2000);
    checkVerificationStatus(); // Check immediately on success state trigger

    return () => clearInterval(intervalId);
  }, [success, registeredUsername, BASE, navigate]);

  const handleChange = e => setForm({...form, [e.target.name]: e.target.value});

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg("");
    setSuccess(false);
    try {
      const res = await fetch(`${BASE}/api/register/`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if(res.ok) {
        setSuccess(true);
        setMsg("Registration successful! We've sent a 6-digit Verification Code to your email.");
        setRegisteredUsername(form.username);
        setForm({ username: "", email: "", password: "", password2: "" });
      } else {
        setMsg(data.error || data.username || data.password || data.email || JSON.stringify(data));
      }
    } catch(err) {
      console.error(err);
      setMsg("Signup failed");
    }
  };

  const handleVerifyOtp = async e => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setMsg("❌ Please enter a valid 6-digit verification code.");
      return;
    }
    
    // Call Django verify-email API directly
    try {
      setMsg("Verifying code...");
      const res = await fetch(`${BASE}/api/verify-email/${otpCode}/`);
      if (res.ok) {
        // Successful verification! Show a clean alert and redirect
        alert("Registration successful!");
        navigate("/login");
      } else {
        setMsg("❌ Invalid or expired verification code.");
      }
    } catch (err) {
      console.error(err);
      setMsg("❌ Verification failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <h2 className="text-3xl font-extrabold mb-6 text-gray-800 tracking-tight text-center">
          {success ? "Verify Email" : "Create Account"}
        </h2>
        
        {msg && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium border flex items-start gap-3 transition-all duration-300 ${
            success && !msg.startsWith("❌")
              ? 'bg-green-50 text-green-800 border-green-100' 
              : 'bg-red-50 text-red-800 border-red-100'
          }`}>
            <span className="text-lg">{success && !msg.startsWith("❌") ? '✉️' : '❌'}</span>
            <p className="flex-1 leading-relaxed">{msg}</p>
          </div>
        )}

        {success ? (
          <div className="space-y-6">
            <p className="text-sm text-gray-500 text-center leading-relaxed">
              Please enter the 6-digit verification code (OTP) sent to your registered email to activate your account.
            </p>
            
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 text-center">
                  6-Digit OTP Code
                </label>
                <input 
                  name="otp" 
                  maxLength={6}
                  onChange={e => setOtpCode(e.target.value)} 
                  value={otpCode} 
                  placeholder="000000" 
                  required 
                  className="w-full text-center text-3xl font-bold tracking-[8px] px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all placeholder:tracking-normal placeholder:font-normal placeholder:text-gray-300"
                />
              </div>
              <button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 rounded-xl transition duration-200 shadow-md shadow-pink-500/10">
                Verify Code & Login
              </button>
            </form>
            
            <div className="text-center text-sm border-t border-gray-100 pt-4">
              <button 
                onClick={() => { setSuccess(false); setMsg(""); }} 
                className="text-pink-600 font-semibold hover:underline bg-transparent border-none cursor-pointer"
              >
                ← Back to Signup
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Username</label>
              <input 
                name="username" 
                onChange={handleChange} 
                value={form.username} 
                placeholder="Choose a username" 
                required 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
              <input 
                name="email" 
                type="email" 
                onChange={handleChange} 
                value={form.email} 
                placeholder="you@example.com" 
                required 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Password</label>
              <input 
                name="password" 
                type="password" 
                onChange={handleChange} 
                value={form.password} 
                placeholder="Create a strong password" 
                required 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Confirm Password</label>
              <input 
                name="password2" 
                type="password" 
                onChange={handleChange} 
                value={form.password2} 
                placeholder="Confirm your password" 
                required 
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              />
            </div>
            <button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 rounded-xl transition duration-200 shadow-md shadow-pink-500/10">
              Sign Up
            </button>
          </form>
        )}

        {!success && (
          <div className="mt-6 pt-4 border-t border-gray-100 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-pink-600 font-semibold hover:underline">
              Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Signup;
