import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import './auth.css';

const Auth = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [active, setActive] = useState(false);

  return (
  <div className="auth">
    <div className={`container ${active ? 'active' : ''}`}>
      <div className="form-container sign-in">
        <Login setIsAuthenticated={setIsAuthenticated} />
      </div>
      <div className="form-container sign-up">
        <Register setIsAuthenticated={setIsAuthenticated} />
      </div>
      <div className="toggle-container">
        <div className="toggle">
          <div className="toggle-panel toggle-left">
            <h1>Hello, User!</h1>
            <p>Already Registered, Click the below button to Login with your details.</p>
            <button onClick={() => { setActive(false); navigate('/login'); }}>Go to Login</button>
          </div>
          <div className="toggle-panel toggle-right">
            <h1>Welcome Back!</h1>
            <p>Not yet Registered?<br />Click the below button to register with your details.</p>
            <button onClick={() => { setActive(true); navigate('/signup'); }}>Go to Sign Up</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default Auth;