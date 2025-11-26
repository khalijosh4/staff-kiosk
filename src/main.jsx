import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Clock, User, Fingerprint, CheckCircle, XCircle, LogIn, LogOut } from 'lucide-react';
import './index.css';

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

const KioskApp = () => {
    const [screen, setScreen] = useState('idle'); // idle, profile, success, error
    const [staffData, setStaffData] = useState(null);
    const [message, setMessage] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [nationalId, setNationalId] = useState('');
    const [loading, setLoading] = useState(false);

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Auto-reset to idle screen after success/error
    useEffect(() => {
        if (screen === 'success' || screen === 'error') {
            const timer = setTimeout(() => {
                resetToIdle();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [screen]);

    const resetToIdle = () => {
        setScreen('idle');
        setStaffData(null);
        setMessage('');
        setNationalId('');
        setLoading(false);
    };

    const verifyStaff = async () => {
        if (!nationalId.trim()) {
            setMessage('Please enter National ID');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/staff/national-id/${nationalId}`);
            const data = await response.json();

            if (data.success) {
                setStaffData(data.data);
                setScreen('profile');
                setMessage('');
            } else {
                setScreen('error');
                setMessage('Staff not found. Please contact administrator.');
            }
        } catch (error) {
            setScreen('error');
            setMessage('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleTimeIn = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/attendance/time-in`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id: staffData.staff_id })
            });
            const data = await response.json();

            if (data.success) {
                setScreen('success');
                setMessage(`Welcome ${staffData.first_name}! Time in recorded at ${new Date().toLocaleTimeString()}`);
            } else {
                setScreen('error');
                setMessage(data.message || 'Time in failed. Please try again.');
            }
        } catch (error) {
            setScreen('error');
            setMessage('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleTimeOut = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/attendance/time-out`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staff_id: staffData.staff_id })
            });
            const data = await response.json();

            if (data.success) {
                setScreen('success');
                setMessage(`Goodbye ${staffData.first_name}! Time out recorded at ${new Date().toLocaleTimeString()}. Total hours: ${data.data.total_hours || 'N/A'}`);
            } else {
                setScreen('error');
                setMessage(data.message || 'Time out failed. Please try again.');
            }
        } catch (error) {
            setScreen('error');
            setMessage('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Idle Screen - Waiting for fingerprint/ID
    if (screen === 'idle') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
                <div className="text-center">
                    {/* Current Time Display */}
                    <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-3xl p-8 mb-8">
                        <div className="text-white text-6xl font-bold mb-2">
                            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div className="text-white text-2xl opacity-90">
                            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>

                    {/* Instruction Card */}
                    <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl">
                        <div className="mb-8">
                            <div className="bg-blue-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                                <Fingerprint className="w-12 h-12 text-blue-600" />
                            </div>
                            <h1 className="text-4xl font-bold text-gray-800 mb-4">Smart Attendance System</h1>
                            <p className="text-xl text-gray-600">Place your finger on the scanner or enter your ID</p>
                        </div>

                        {/* Manual ID Entry */}
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Enter National ID Number"
                                value={nationalId}
                                onChange={(e) => setNationalId(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && verifyStaff()}
                                className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                                disabled={loading}
                            />
                            <button
                                onClick={verifyStaff}
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-4 text-xl font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {loading ? 'Verifying...' : 'Verify Identity'}
                            </button>
                        </div>

                        {message && (
                            <div className="mt-6 text-red-600 text-center">
                                {message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Profile Screen - Show staff details and action buttons
    if (screen === 'profile') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 text-center">
                        <h2 className="text-3xl font-bold">Staff Verification Successful</h2>
                        <p className="text-xl mt-2 opacity-90">{currentTime.toLocaleTimeString()}</p>
                    </div>

                    {/* Profile Content */}
                    <div className="p-12">
                        <div className="flex gap-8">
                            {/* Photo Section - Right Side */}
                            <div className="flex-shrink-0">
                                <div className="w-48 h-56 bg-gray-200 rounded-xl overflow-hidden border-4 border-blue-200 shadow-lg">
                                    {staffData.photo_path ? (
                                        <img
                                            src={`${API_BASE_URL.replace('/api', '')}${staffData.photo_path}`}
                                            alt={`${staffData.first_name} ${staffData.last_name}`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                                            <User className="w-24 h-24 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Details Section - Left Side */}
                            <div className="flex-1 space-y-4">
                                <div className="bg-blue-50 rounded-xl p-6">
                                    <h3 className="text-3xl font-bold text-gray-800 mb-6">
                                        {staffData.first_name} {staffData.last_name}
                                    </h3>

                                    <div className="grid grid-cols-2 gap-4 text-lg">
                                        <div>
                                            <p className="text-gray-600 font-medium">Staff ID</p>
                                            <p className="text-gray-900 font-semibold">{staffData.staff_id}</p>
                                        </div>

                                        <div>
                                            <p className="text-gray-600 font-medium">National ID</p>
                                            <p className="text-gray-900 font-semibold">{staffData.national_id}</p>
                                        </div>

                                        <div>
                                            <p className="text-gray-600 font-medium">Department</p>
                                            <p className="text-gray-900 font-semibold">{staffData.department || 'N/A'}</p>
                                        </div>

                                        <div>
                                            <p className="text-gray-600 font-medium">Position</p>
                                            <p className="text-gray-900 font-semibold">      {staffData.position || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-6 pt-4">
                                    <button
                                        onClick={handleTimeIn}
                                        disabled={loading}
                                        className="bg-green-600 text-white py-6 rounded-xl font-bold text-2xl hover:bg-green-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        <LogIn className="w-8 h-8" />
                                        TIME IN
                                    </button>

                                    <button
                                        onClick={handleTimeOut}
                                        disabled={loading}
                                        className="bg-red-600 text-white py-6 rounded-xl font-bold text-2xl hover:bg-red-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-3"
                                    >
                                        <LogOut className="w-8 h-8" />
                                        TIME OUT
                                    </button>
                                </div>

                                <button
                                    onClick={resetToIdle}
                                    className="w-full mt-4 text-gray-600 py-3 hover:text-gray-800 transition text-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Success Screen
    if (screen === 'success') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-16 text-center max-w-2xl">
                    <div className="bg-green-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                        <CheckCircle className="w-20 h-20 text-green-600" />
                    </div>

                    <h2 className="text-4xl font-bold text-gray-800 mb-4">Success!</h2>
                    <p className="text-2xl text-gray-600 mb-8">{message}</p>

                    <div className="text-gray-500 text-lg">
                        Returning to main screen in 5 seconds...
                    </div>

                    <button
                        onClick={resetToIdle}
                        className="mt-8 bg-green-600 text-white px-8 py-4 rounded-xl text-xl font-semibold hover:bg-green-700 transition"
                    >
                        Return Now
                    </button>
                </div>
            </div>
        );
    }

    // Error Screen
    if (screen === 'error') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-16 text-center max-w-2xl">
                    <div className="bg-red-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                        <XCircle className="w-20 h-20 text-red-600" />
                    </div>

                    <h2 className="text-4xl font-bold text-gray-800 mb-4">Error!</h2>
                    <p className="text-2xl text-gray-600 mb-8">{message}</p>

                    <div className="text-gray-500 text-lg mb-8">
                        Returning to main screen in 5 seconds...
                    </div>

                    <button
                        onClick={resetToIdle}
                        className="bg-red-600 text-white px-8 py-4 rounded-xl text-xl font-semibold hover:bg-red-700 transition"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default KioskApp;

// Render the app
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <KioskApp />
    </React.StrictMode>
);

