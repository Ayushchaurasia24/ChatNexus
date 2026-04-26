import "../styles/input.css";

function Input({ type, placeholder, name, onChange }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      name={name}
      className="custom-input"
      onChange={onChange}
    />
  );
}

export default Input;