import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { LoadingOverlay } from "../components/LoadingSpinner";
import AdminDashboard from "./AdminDashboard";
import TenantDashboard from "./TenantDashboard";
import type { UserData } from "../types";

const API_URL = import.meta.env.VITE_API_URL as string;

function Dashboard() {
    const [token, setToken] = useState<string | null | undefined>(undefined);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem("token");
        if (!savedToken) {
            setToken(null);
            setIsInitialLoading(false);
            return;
        }
        setToken(savedToken);

        // Fetch user data to determine role - IMPORTANTE: El backend debe validar permisos
        fetch(`${API_URL}/dashboard`, {
            headers: {
                Authorization: `Bearer ${savedToken}`,
                "Content-Type": "application/json",
            },
        })
        .then((res) => {
            if (!res.ok) {
                throw new Error('Authentication failed');
            }
            return res.json();
        })
        .then((dashboardData) => {
            setUserData(dashboardData);
        })
        .catch((error) => {
            console.error('Auth error:', error);
            // Si hay error de autenticación, redirigir al login
            localStorage.removeItem("token");
            setToken(null);
        })
        .finally(() => {
            setIsInitialLoading(false);
        });
    }, []);

    if (token === undefined || isInitialLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <LoadingOverlay isVisible={true} text="Verificando permisos..." />
            </div>
        );
    }

    if (!token) return <Navigate to="/login" replace />;

    // Determine which dashboard to show based on user role
    const userRole = userData?.user?.role || "tenant";

    if (userRole === "admin") {
        return <AdminDashboard />;
    }

    // Default to tenant dashboard for "tenant", "owner", or any other role
    return <TenantDashboard />;
}

export default Dashboard;