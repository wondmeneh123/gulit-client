import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User2, Lock, LogIn } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      if (user && user.role === 'BORROWER') {
        navigate('/user');
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred during login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-blue-100 to-purple-100 relative overflow-hidden">
      {/* Glassy background blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-yellow-300 rounded-full opacity-30 blur-2xl -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full opacity-30 blur-2xl -z-10" />
      <div className="max-w-md w-full space-y-8 bg-white/30 backdrop-blur-lg border border-white/30 shadow-2xl rounded-2xl p-8">
        <div className="flex flex-col items-center">
          {/* Gulit SACCO Branding */}
          <span className="text-2xl font-extrabold text-yellow-500 tracking-wide mb-1 drop-shadow">Gulit SACCO</span>
          {/* Logo or Icon */}
        
            <LogIn className="w-8 h-8 text-white" />
            <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 drop-shadow">
            Sign in to your account
          </h2>
      
        
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div className="relative">
              <User2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="username"
                name="username"
                type="text"
                required
                className="pl-10 pr-3 py-2 w-full rounded-lg border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-yellow-400 focus:border-yellow-400 focus:z-10 sm:text-sm bg-white/60"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="password"
                name="password"
                type="password"
                required
                className="pl-10 pr-3 py-2 w-full rounded-lg border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-yellow-400 focus:border-yellow-400 focus:z-10 sm:text-sm bg-white/60"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 transition"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
