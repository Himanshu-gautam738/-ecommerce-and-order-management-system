import { useState } from "react";
import { Link } from "react-router-dom";

function Signup() {
  const BASE = import.meta.env.VITE_DJANGO_BASE_URL;
  const [form, setForm] = useState({ username: "", email: "", password: "", password2: "" });
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);

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
        setMsg(data.message || "Registration successful!");
      } else {
        setMsg(data.error || data.username || data.password || data.email || JSON.stringify(data));
      }
    } catch(err) {
      console.error(err);
      setMsg("Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Signup</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input name="username" onChange={handleChange} value={form.username} placeholder="Username" required className="w-full p-2 border rounded"/>
          <input name="email" type="email" onChange={handleChange} value={form.email} placeholder="Email" required className="w-full p-2 border rounded"/>
          <input name="password" type="password" onChange={handleChange} value={form.password} placeholder="Password" required className="w-full p-2 border rounded"/>
          <input name="password2" type="password" onChange={handleChange} value={form.password2} placeholder="Confirm Password" required className="w-full p-2 border rounded"/>
          <button className="w-full bg-pink-600 text-white py-2 rounded hover:bg-pink-700 transition">Create Account</button>
        </form>
        {msg && <p className="mt-3 text-sm text-red-500">{msg}</p>}
        <div className="mt-4 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-pink-600 hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;
