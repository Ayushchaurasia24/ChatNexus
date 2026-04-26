import { useState } from "react";
import "../styles/signup.css";
import Input from "../components/Input";
import Button from "../components/Button";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
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

    const { name, email, phone, password } = formData;

    if (!name || !email || !phone || !password) {
      alert("All fields are required");
      return;
    }

    if (!email.includes("@")) {
      alert("Invalid email");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    console.log("Signup Data:", formData);
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

          <Button text="Sign Up" />
        </form>
      </div>
    </div>
  );
}

export default Signup;