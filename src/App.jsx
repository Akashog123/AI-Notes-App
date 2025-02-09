import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Auth from './Auth';
import Dashboard from './Dashboard';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
	const token = localStorage.getItem('token');
	if (!token){ 
		useEffect(() => {
		return navigate("/login");
	}, []);
	}
	return children;
};

function App() {
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	useEffect(() => {
		const token = localStorage.getItem('token');
		if (token) setIsAuthenticated(true);
	}, []);

	return (
		<Router>
				<Routes>
					<Route path="/" element={
						<ProtectedRoute>
						<Dashboard />
					</ProtectedRoute>} />
					<Route path="/dashboard" element={
						<ProtectedRoute>
							<Dashboard />
						</ProtectedRoute>
					} />
					<Route path="/login" element={<Auth setIsAuthenticated={setIsAuthenticated} initialView="login" />} />
					<Route path="/signup" element={<Auth setIsAuthenticated={setIsAuthenticated} initialView="signup" />} />
				</Routes>
		</Router>
	);
}

export default App;
