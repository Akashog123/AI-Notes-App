import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import './style.css';

const Login = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    // call backend login endpoint
    try {
      const res = await fetch('/api/auth/login', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        setIsAuthenticated(true);
        toast({ title: "Login Successful", description: "Welcome! Back", className: "bg-green-600 text-white border-success" });
        navigate('/dashboard');
      } else {
        toast({ title: "Something went wrong", description: "Please try again.", className: "bg-red-600 text-white border-success" });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h1>Login</h1>
        <div className="social-icons">
          <a href="#" className="icon"><i className="fa-brands fa-google-plus-g"></i></a>
          <a href="#" className="icon"><i className="fa-brands fa-facebook-f"></i></a>
          <a href="#" className="icon"><i className="fa-brands fa-github"></i></a>
          <a href="#" className="icon"><i className="fa-brands fa-linkedin-in"></i></a>
        </div>
        <span>or use your email password</span>
        <input type="text" placeholder="Username" autoComplete="username" value={username}
          onChange={(e) => setUsername(e.target.value)} required />
        <input type="password" placeholder="Password" autoComplete="current-password" value={password}
          onChange={(e) => setPassword(e.target.value)} required />
        <a href="#">Forget Your Password?</a>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
