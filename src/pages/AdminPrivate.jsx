import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from "firebase/auth";

const PrivateRoute = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const auth = getAuth();

    useEffect(() => {
        // Listener to check auth state in real-time
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [auth]);

    if (loading) {
        return <div style={{textAlign: 'center', marginTop: '50px'}}>Loading...</div>;
    }

    if (!user) {
        // If not logged in, redirect to login page
        return <Navigate to="/" replace />;
    }

    // If logged in, render the protected component (e.g., AdminHome)
    return children;
};

export default PrivateRoute;