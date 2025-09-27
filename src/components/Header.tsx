import { User, LogOut, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LogoutConfirmModal from "./LogoutConfirmModal";
import LogoutSuccessToast from "./LogoutSuccessToast";

interface HeaderProps {
    userName: string;
    onProfileClick: () => void;
    showProfileMenu?: boolean;
    onLogout?: () => void;
    onClaimsClick?: () => void;
}

function Header({ userName, onProfileClick, showProfileMenu = true, onLogout, onClaimsClick }: HeaderProps) {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        setShowLogoutModal(true);
        setIsMenuOpen(false);
    };

    const handleConfirmLogout = () => {
        setShowLogoutModal(false);
        
        // Clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        if (onLogout) onLogout();
        
        // Show success toast
        setShowSuccessToast(true);
    };

    const handleCancelLogout = () => {
        setShowLogoutModal(false);
    };

    const handleLogoutComplete = () => {
        setShowSuccessToast(false);
        navigate('/login');
    };

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo and App Name */}
                    <div className="flex items-center space-x-3">
                        <img
                            src="/src/assets/Logo_Us_2.png"
                            alt="Logo US"
                            className="w-10 h-10 object-contain"
                        />
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold text-gray-900">US</h1>
                            <span className="text-xs text-gray-500 -mt-1">Gestión de Consorcio</span>
                        </div>
                    </div>

                    {/* Center - Navigation (for future expansion) */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <button className="text-gray-700 hover:text-gray-900 font-medium transition-colors cursor-pointer">
                            Dashboard
                        </button>
                        <button 
                            onClick={onClaimsClick}
                            className="text-gray-500 hover:text-gray-700 font-medium transition-colors cursor-pointer"
                        >
                            Reclamos
                        </button>
                        <button className="text-gray-500 hover:text-gray-700 font-medium transition-colors cursor-not-allowed">
                            Amenities
                        </button>
                    </nav>

                    {/* Right side - User menu */}
                    {showProfileMenu && (
                        <div className="relative" ref={menuRef}>
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors group cursor-pointer"
                                >
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-medium text-gray-900">
                                            {userName}
                                        </p>

                                    </div>
                                    <div className="w-10 h-10 bg-gradient-to-r from-gray-400 via-gray-500 to-gray-700 rounded-full flex items-center justify-center group-hover:from-gray-500 group-hover:via-gray-600 group-hover:to-gray-800 transition-all">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                </button>

                            {/* Dropdown Menu */}
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                    <button
                                        onClick={() => {
                                            onProfileClick();
                                            setIsMenuOpen(false);
                                        }}
                                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                        <Settings className="w-4 h-4" />
                                        <span>Configuración</span>
                                    </button>
                                    
                                    <hr className="my-1 border-gray-200" />
                                    
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Cerrar sesión</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Logout Confirmation Modal */}
            <LogoutConfirmModal
                isVisible={showLogoutModal}
                onConfirm={handleConfirmLogout}
                onCancel={handleCancelLogout}
            />
            
            {/* Logout Success Toast */}
            <LogoutSuccessToast
                isVisible={showSuccessToast}
                onComplete={handleLogoutComplete}
            />
        </header>
    );
}

export default Header;