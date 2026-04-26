import { useState } from "react";
import "../styles/signup.css";
import Input from "../components/Input";
import Button from "../components/Button";
import { Link, useNavigate } from "react-router-dom";
import { signupUser } from "../services/authService";

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [loading, setLoading] = useState(false); // ✅ added

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, phone, password } = formData;

    if (!name || !email || !phone || !password) {
      alert("All fields are required");
      return;
    }

    setLoading(true); // ✅ start loading

    try {
      const res = await signupUser(formData);

      alert(res.data.message);

      navigate("/login"); // ✅ REDIRECT ADDED

    } catch (error) {
      alert(error.response?.data?.message || "Signup failed");
    }

    setLoading(false); // ✅ stop loading
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h2>ChatNexus</h2>
        <p>Create your account</p>

        <form onSubmit={handleSubmit}>
          <Input type="text" name="name" placeholder="Full Name" onChange={handleChange} />
          <Input type="email" name="email" placeholder="Email Address" onChange={handleChange} />
          <Input type="text" name="phone" placeholder="Phone Number" onChange={handleChange} />
          <Input type="password" name="password" placeholder="Password" onChange={handleChange} />

          <Button text={loading ? "Signing up..." : "Sign Up"} /> {/* ✅ improved UX */}
        </form>

        <p style={{ textAlign: "center", marginTop: "10px" }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;