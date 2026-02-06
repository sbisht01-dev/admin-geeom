import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { app } from '../../firebaseConfig';
import { Lock } from 'lucide-react';
import './login.css'; 
    
const AdminLogin = () => {
    const auth = getAuth(app);
    const navigate = useNavigate();
  
    useEffect(() =>{
try {
        const unsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
                console.log(user);
                navigate('adminHome');
            } else {
                console.log("No user");
            }
        })
        return unsubscribe;
    } catch (error) {
        console.log(error);
    }
    })
    
    // {
    //     const db = getDatabase(app);
    //     const dbRef = ref(db);
    //     get(child(dbRef, `site_variables`)).then((snapshot) => {
    //         if (snapshot.exists()) {
    //             console.log(snapshot.val());
    //         } else {
    //             console.log("No data available");
    //         }
    //     }).catch((error) => {
    //         console.error(error);
    //     });
    // }


    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handlePassChange = (e) => {
        setPassword(e.target.value);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log("Login Successful! Redirecting...");
        } catch (err) {
            console.log("error");
            console.error(err);
            if (err.code === 'auth/invalid-credential') {
                setError("Invalid email or password.");
            } else {
                setError("Failed to sign in. Please check your connection.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">

                {/* Header */}
                <div className="login-header">
                    <div className="icon-container">
                        <Lock size={24} strokeWidth={2.5} />
                    </div>
                    <h1 className="login-title">Admin Panel</h1>
                    <p className="login-subtitle">Sign in to manage your finance site</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="login-form">

                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            // value={formData.email}
                            onChange={handleEmailChange}
                            placeholder="admin@finance.com"
                            required
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            // value={formData.password}
                            onChange={handlePassChange}
                            required
                            className="form-input"
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" disabled={loading} className="submit-btn">
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;