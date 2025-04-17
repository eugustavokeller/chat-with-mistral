import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for system dark mode preference
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setIsDarkMode(prefersDark);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!username.trim()) {
      return setError("Username is required");
    }
    if (!password) {
      return setError("Password is required");
    }

    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <div
        className={`max-w-md w-full space-y-8 p-8 rounded-xl shadow-lg ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="text-center">
          <h2
            className={`text-3xl font-extrabold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Welcome back
          </h2>
          <p
            className={`mt-2 text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Sign in to your account to continue
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label
                htmlFor="username"
                className={`block text-sm font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  isDarkMode
                    ? "border-gray-600 bg-gray-700 text-white"
                    : "border-gray-300"
                } placeholder-gray-500 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className={`block text-sm font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  isDarkMode
                    ? "border-gray-600 bg-gray-700 text-white"
                    : "border-gray-300"
                } placeholder-gray-500 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                "Sign in"
              )}
            </button>
          </div>

          <div className="text-center">
            <p
              className={`text-sm ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
