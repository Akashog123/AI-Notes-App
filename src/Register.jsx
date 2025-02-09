import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './style.css';
import { useToast } from '@/hooks/use-toast';

const Register = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const contentType = res.headers.get("content-type");
      let data;
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error("Server returned non-JSON response: " + text);
      }
      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        setIsAuthenticated(true);
        toast({ title: "Registration Successful", description: "Welcome! to AI Notes...", className: "bg-green-500 text-white border-success" });
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else{
        alert(data.error || "Registration failed");
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h1>Create Account</h1>
        <div className="social-icons">
          <a href="#" className="icon"><i className="fa-brands fa-google-plus-g"></i></a>
          <a href="#" className="icon"><i className="fa-brands fa-facebook-f"></i></a>
          <a href="#" className="icon"><i className="fa-brands fa-github"></i></a>
          <a href="#" className="icon"><i className="fa-brands fa-linkedin-in"></i></a>
        </div>
        <span>or use your email for registration</span>
        <input type="text" placeholder="Name" value={username}
          onChange={(e) => setUsername(e.target.value)} required />
        <input type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Sign Up</button>
      </form>
    </div>
  );
};

export default Register;
