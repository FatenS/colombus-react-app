import { useState } from "react";
import axiosInstance from "../../../services/AxiosInstance";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent , setSent ] = useState(false);
  const [msg  , setMsg  ] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/profile/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setMsg(err.response?.data?.msg || "Error");
    }
  };

  return (
    <div className="container mt-5">
      {sent ? (
        <p>If the address exists you’ll receive an email shortly.</p>
      ) : (
        <form onSubmit={handleSubmit} style={{maxWidth:400}}>
          <h3>Forgot password</h3>
          {msg && <div className="alert alert-danger">{msg}</div>}
          <input
            type="email"
            className="form-control mb-3"
            placeholder="your@email.com"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />
          <button className="btn btn-primary w-100">Send reset link</button>
        </form>
      )}
    </div>
  );
}
