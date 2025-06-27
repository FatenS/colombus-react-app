import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../services/AxiosInstance";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [pwd1 , setPwd1 ] = useState("");
  const [pwd2 , setPwd2 ] = useState("");
  const [msg  , setMsg  ] = useState("");
  const [done , setDone ] = useState(false);
  const nav = useNavigate();

  const handleSubmit = async (e)=>{
    e.preventDefault();
    if(pwd1!==pwd2){ setMsg("Passwords don’t match"); return; }
    try{
      await axiosInstance.post("/profile/reset-password",{token,password:pwd1});
      setDone(true);
      setTimeout(()=>nav("/login"),2500);
    }catch(err){
      setMsg(err.response?.data?.msg || "Error");
    }
  };

  if(!token) return <p>Invalid link</p>;

  return done ? (
    <p>Password updated! Redirecting to login…</p>
  ) : (
    <form onSubmit={handleSubmit} style={{maxWidth:400,margin:"4rem auto"}}>
      <h3>Choose a new password</h3>
      {msg && <div className="alert alert-danger">{msg}</div>}
      <input type="password" className="form-control mb-2"
             placeholder="New password" value={pwd1}
             onChange={e=>setPwd1(e.target.value)} required/>
      <input type="password" className="form-control mb-3"
             placeholder="Repeat password" value={pwd2}
             onChange={e=>setPwd2(e.target.value)} required/>
      <button className="btn btn-primary w-100">Update password</button>
    </form>
  );
}
