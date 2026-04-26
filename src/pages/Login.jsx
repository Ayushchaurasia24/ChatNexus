import { useState } from "react";
import "../styles/signup.css"; // reuse same styling
import Input from "../components/Input";
import Button from "../components/Button";
import { Link } from "react-router-dom";

function Login() {
  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const { emailOrPhone, password } = formData;

    if (!emailOrPhone || !password) {
      alert("All fields are required");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    console.log("Login Data:", formData);
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h2>ChatNexus</h2>
        <p>Login to your account</p>

        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            name="emailOrPhone"
            placeholder="Email or Phone"
            onChange={handleChange}
          />

          <Input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
          />

          <Button text="Login" />
        </form>
        <p style={{ textAlign: "center", marginTop: "10px" }}>
            Don’t have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;