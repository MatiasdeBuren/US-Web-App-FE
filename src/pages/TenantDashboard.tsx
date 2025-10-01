import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { createReservation } from "../api_calls/post_reservation";

import { getReservationsByAmenity } from "../api_calls/get_amenity_reservations";
import { updateUserName } from "../api_calls/update_user_name";
import { updateUserPassword } from "../api_calls/update_user_password";
import { deleteUser } from "../api_calls/delete_user";
import { cancelReservation } from "../api_calls/cancel_reservation";
import { hideReservationFromUser } from "../api_calls/hide_reservation";


// Componentes reutilizables
import Header from "../components/Header";
import ProfilePanel from "../components/ProfilePanel";
import EditProfileModal from "../components/EditProfileModal";
import ChangePasswordModal from "../components/ChangePasswordModal";
import DeleteAccountModal from "../components/DeleteAccountModal";
import SpaceSelector from "../components/SpaceSelector";
import TimeSelector from "../components/TimeSelector";
import ReservationList from "../components/ReservationList";
import { LoadingOverlay } from "../components/LoadingSpinner";
import LogoutSuccessToast from "../components/LogoutSuccessToast";
import PasswordChangeSuccessToast from "../components/PasswordChangeSuccessToast";
import CancelReservationModal from "../components/CancelReservationModal";
import ReservationCancelledToast from "../components/ReservationCancelledToast";
import ReservationHiddenToast from "../components/ReservationHiddenToast";
import ReservationSuccessToast from "../components/ReservationSuccessToast";
import ReservationErrorToast from "../components/ReservationErrorToast";
import ClaimsPage from "./ClaimsPage";

// Tipos
import type { UserData, ReservationData, Reservation, Amenity } from "../types";

const API_URL = import.meta.env.VITE_API_URL as string;

function TenantDashboard() {
    const [token, setToken] = useState<string | null | undefined>(undefined);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [selectedSpace, setSelectedSpace] = useState<string>("Gym");
    const [selectedTime, setSelectedTime] = useState<string>("08:00 - 09:00");
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [reservations, setReservations] = useState<ReservationData>({});
    const [timeError, setTimeError] = useState<string | null>(null);
    const [userReservations, setUserReservations] = useState<Reservation[]>([]);
    const [selectedDate, setSelectedDate] = useState("");

    const [showProfile, setShowProfile] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [showPasswordPopup, setShowPasswordPopup] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState(false);
    const [showPasswordChangeToast, setShowPasswordChangeToast] = useState(false);
    const [newName, setNewName] = useState("");
    
    // Tab navigation state
    const [activeTab, setActiveTab] = useState<"dashboard" | "reclamos">("dashboard");

    // Loading states
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isReserving, setIsReserving] = useState(false);
    const [isCancelling, setIsCancelling] = useState<number | null>(null);
    const [isHiding, setIsHiding] = useState<number | null>(null);
    const [isSavingName, setIsSavingName] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    // Cancel reservation modal and toast states
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null);
    const [showCancelToast, setShowCancelToast] = useState(false);
    
    // Hidden reservation toast state
    const [showHiddenToast, setShowHiddenToast] = useState(false);
    
    // Success reservation toast state
    const [showReservationToast, setShowReservationToast] = useState(false);
    
    // Error toast state
    const [showErrorToast, setShowErrorToast] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successReservationData, setSuccessReservationData] = useState<{ amenityName: string; timeSlot: string } | null>(null);
    
    // Error reservation toast state
    const [showReservationErrorToast, setShowReservationErrorToast] = useState(false);
    const [reservationErrorMessage, setReservationErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const savedToken = localStorage.getItem("token");
        if (!savedToken) {
            setToken(null);
            setIsInitialLoading(false);
            return;
        }
        setToken(savedToken);

        Promise.all([
            fetch(`${API_URL}/dashboard`, {
                headers: {
                    Authorization: `Bearer ${savedToken}`,
                    "Content-Type": "application/json",
                },
            }).then((res) => res.json()),
            
            fetch(`${API_URL}/amenities`, {
                headers: { Authorization: `Bearer ${savedToken}` },
            }).then((res) => res.json())
        ])
        .then(([dashboardData, amenitiesData]) => {
            setUserData(dashboardData);
            setNewName(dashboardData.user.name);
            setAmenities(amenitiesData);
        })
        .catch(console.error)
        .finally(() => {
            setIsInitialLoading(false);
        });
    }, []);

    useEffect(() => {
        if (amenities.length > 0) {
            setSelectedSpace(amenities[0].name);
            
            // Initialize date to today if not set
            if (!selectedDate) {
                const today = new Date();
                const formattedDate = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
                setSelectedDate(formattedDate);
            }
            
            setReservations((prev) => {
                const newReservations: ReservationData = { ...prev };
                amenities.forEach((a) => {
                    if (!newReservations[a.name]) {
                        newReservations[a.name] = { "08:00 - 09:00": 0, "09:00 - 10:00": 0 };
                    }
                });
                return newReservations;
            });
            setSelectedTime("08:00 - 09:00");
        }
    }, [amenities]);

    useEffect(() => {
        if (!token) return;
        fetch(`${API_URL}/reservations`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then(setUserReservations)
            .catch(console.error);
    }, [token]);

    if (token === undefined || isInitialLoading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <LoadingOverlay isVisible={true} text="Cargando dashboard..." />
            </div>
        );
    }
    if (!token) return <Navigate to="/login" />;

    const handleReserve = async () => {
        setIsReserving(true);
        setTimeError(null); // Clear any previous errors
        
        // Helper function to build timestamp from user's selected time (NO timezone conversion)
        const buildTimestampFromUserTime = (dateStr: string, timeStr: string): string => {
            // dateStr: "2025-10-01", timeStr: "19:00"
            const [hours, minutes] = timeStr.split(':');
            return `${dateStr}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00.000Z`;
        };
        
        try {
            const [startStr, endStr] = selectedTime.split(" - ");
            
            // Get selected amenity for validation
            const selectedAmenity = amenities.find((a) => a.name === selectedSpace);
            if (!selectedAmenity) {
                setTimeError("❌ Amenity no encontrado");
                setIsReserving(false);
                return;
            }

            // Check if amenity is active
            if (selectedAmenity.isActive === false) {
                setTimeError("❌ Este amenity no está disponible actualmente");
                setIsReserving(false);
                return;
            }

            // Validation: Check operating hours
            if (selectedAmenity.openTime && selectedAmenity.closeTime) {
                const [openHour, openMin] = selectedAmenity.openTime.split(":").map(Number);
                const [closeHour, closeMin] = selectedAmenity.closeTime.split(":").map(Number);
                const [startHour, startMin] = startStr.split(":").map(Number);
                const [endHour, endMin] = endStr.split(":").map(Number);
                
                const openMinutes = openHour * 60 + openMin;
                const closeMinutes = closeHour * 60 + closeMin;
                const startMinutes = startHour * 60 + startMin;
                const endMinutes = endHour * 60 + endMin;
                
                if (startMinutes < openMinutes || endMinutes > closeMinutes) {
                    setTimeError(`❌ El horario seleccionado está fuera del horario de operación (${selectedAmenity.openTime} - ${selectedAmenity.closeTime})`);
                    setIsReserving(false);
                    return;
                }
            }
            
            // Crear fecha en zona horaria local, no UTC
            const [year, month, day] = selectedDate.split('-').map(Number);
            const baseDate = new Date(year, month - 1, day); // month es 0-indexado
            const startDateTime = new Date(baseDate);
            const endDateTime = new Date(baseDate);

            const [sh, sm] = startStr.split(":").map(Number);
            const [eh, em] = endStr.split(":").map(Number);
            startDateTime.setHours(sh, sm, 0, 0);
            endDateTime.setHours(eh, em, 0, 0);

            // Validation: Check if the reservation time is in the past
            const currentTime = new Date();
            if (startDateTime < currentTime) {
                setTimeError("❌ No puedes hacer una reserva para una hora que ya ha pasado");
                setIsReserving(false);
                return;
            }

            // Additional validation: Check if reservation is less than 5 minutes from now
            const fiveMinutesFromNow = new Date(currentTime.getTime() + 5 * 60 * 1000);
            if (startDateTime < fiveMinutesFromNow) {
                setTimeError("❌ Las reservas deben hacerse con al menos 5 minutos de anticipación");
                setIsReserving(false);
                return;
            }

            const amenity = selectedAmenity;
            if (!amenity) return;

            const reservationData = await createReservation(token, {
                amenityId: amenity.id,
                startTime: buildTimestampFromUserTime(selectedDate, startStr),
                endTime: buildTimestampFromUserTime(selectedDate, endStr),
            });

            // Actualizar contador de reservas
            setReservations((prev) => ({
                ...prev,
                [selectedSpace]: {
                    ...prev[selectedSpace],
                    [selectedTime]: (prev[selectedSpace][selectedTime] || 0) + 1,
                },
            }));

            // Crear la nueva reserva para añadir a la lista
            const newReservation: Reservation = {
                id: reservationData.id || reservationData.reservation?.id || Date.now(),
                startTime: buildTimestampFromUserTime(selectedDate, startStr),
                endTime: buildTimestampFromUserTime(selectedDate, endStr),
                status: reservationData.status || reservationData.reservation?.status || "pending",
                amenity: {
                    id: amenity.id,
                    name: amenity.name,
                }
            };

            // Añadir la nueva reserva al principio de la lista (más reciente primero)
            setUserReservations((prev) => [newReservation, ...prev]);

            setTimeError(null);
            
            // Show success toast with reservation details
            setSuccessReservationData({
                amenityName: selectedSpace,
                timeSlot: selectedTime
            });
            setShowReservationToast(true);


        } catch (err: any) {
            // Show error toast instead of inline error
            setReservationErrorMessage(err.message || "Error al procesar la reserva");
            setShowReservationErrorToast(true);
            // Clear any existing time error since we're showing toast instead
            setTimeError(null);
        } finally {
            setIsReserving(false);
        }
    };
    const handleCancelReservation = (reservationId: number) => {
        // Find the reservation to cancel
        const reservation = userReservations.find(r => r.id === reservationId);
        if (reservation) {
            setReservationToCancel(reservation);
            setShowCancelModal(true);
        }
    };

    const handleConfirmCancelReservation = async () => {
        if (!token || !reservationToCancel) return;
        
        setIsCancelling(reservationToCancel.id);
        try {
            await cancelReservation(token, reservationToCancel.id);
            // Update local state to mark as cancelled
            setUserReservations(prev =>
                prev.map(r => r.id === reservationToCancel.id ? { ...r, status: "cancelled" } : r)
            );
            
            // Close modal and show toast
            setShowCancelModal(false);
            setShowCancelToast(true);
        } catch (err: any) {
            console.error(err);
            setErrorMessage("Error canceling reservation: " + err.message);
            setShowErrorToast(true);
        } finally {
            setIsCancelling(null);
            setReservationToCancel(null);
        }
    };

    const handleRemoveFromView = async (reservationId: number) => {
        if (!token) return;
        setIsHiding(reservationId);
        try {
            // Llamar a la API para marcar como hidden_from_user = true
            await hideReservationFromUser(token, reservationId);
            
            // Remove the reservation from the local state (hide from view)
            setUserReservations(prev =>
                prev.filter(r => r.id !== reservationId)
            );
            
            // Show success toast
            setShowHiddenToast(true);
        } catch (err: any) {
            console.error(err);
            setErrorMessage("Error ocultando reserva: " + err.message);
            setShowErrorToast(true);
        } finally {
            setIsHiding(null);
        }
    };


    const handleSaveName = async () => {
        if (!token) return;
        setIsSavingName(true);
        try {
            await updateUserName(token, { name: newName });
            setUserData((prev) => prev && { ...prev, user: { ...prev.user, name: newName } });
            setShowEditPopup(false);

        } catch (err) {
            setErrorMessage("Error al actualizar nombre: " + (err instanceof Error ? err.message : "Error desconocido"));
            setShowErrorToast(true);
        } finally {
            setIsSavingName(false);
        }
    };

    const handleChangePassword = async (currentPassword: string, newPassword: string) => {
        if (!token) return;
        await updateUserPassword(token, { currentPassword, newPassword });
        setShowPasswordPopup(false);
        setShowPasswordChangeToast(true);
    };

    // Function to get current reservation count for a specific time slot
    const getCurrentReservationCount = async (amenityName: string, date: string, timeSlot: string): Promise<number> => {
        if (!token) return 0;
        
        const amenity = amenities.find(a => a.name === amenityName);
        if (!amenity) return 0;

        try {
            // Parse the time slot (e.g., "14:00 - 15:00")
            const [startTimeStr, endTimeStr] = timeSlot.split(" - ");
            if (!startTimeStr || !endTimeStr) return 0;

            // Create start and end datetime strings in local timezone
            const localSlotStart = new Date(`${date}T${startTimeStr}:00`);
            const localSlotEnd = new Date(`${date}T${endTimeStr}:00`);

            // Get reservations for the specific date
            const reservations = await getReservationsByAmenity(token, amenity.id, date, date);
            
            if (reservations.length === 0) {
                return 0;
            }
            
            // Count overlapping reservations
            let count = 0;
            reservations.forEach(reservation => {
                const resStart = new Date(reservation.startTime); // UTC from backend
                const resEnd = new Date(reservation.endTime);     // UTC from backend

                // Check if there's any overlap (all times in UTC for consistent comparison)
                const hasOverlap = resStart < localSlotEnd && resEnd > localSlotStart;
                
                if (hasOverlap) {
                    count++;
                }
            });

            return count;
        } catch (error) {
            console.error('Error calculating reservation count:', error);
            return 0;
        }
    };

    // Function to calculate occupancy percentage for an amenity at a specific date/time
    const getAmenityOccupancy = async (amenityName: string, date: string, timeSlot: string): Promise<number> => {
        if (!token) return 0;
        
        const amenity = amenities.find(a => a.name === amenityName);
        if (!amenity) return 0;

        try {
            const currentReservations = await getCurrentReservationCount(amenityName, date, timeSlot);
            const occupancyPercentage = (currentReservations / amenity.capacity) * 100;
            return Math.min(100, occupancyPercentage); // Cap at 100%
        } catch (error) {
            console.error('Error calculating amenity occupancy:', error);
            return 0;
        }
    };

    const handleLogout = () => {
        setShowProfile(false); // Close the profile panel first
        setShowSuccessToast(true);
    };

    const handleLogoutComplete = () => {
        setShowSuccessToast(false);
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    const handlePasswordChangeComplete = () => {
        setShowPasswordChangeToast(false);
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    const handleDeleteAccount = () => {
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!token || isDeletingAccount) return;

        setIsDeletingAccount(true);
        try {
            await deleteUser(token);
            setShowDeleteConfirm(false);
            setShowProfile(false);
            setShowSuccessToast(true);
        } catch (err) {
            setShowDeleteConfirm(false);
            setErrorMessage("Error al eliminar la cuenta: " + (err instanceof Error ? err.message : "Error desconocido"));
            setShowErrorToast(true);
        } finally {
            setIsDeletingAccount(false);
        }
    };

    return (
        <div className={`min-h-screen bg-gray-100 overflow-hidden ${(showSuccessToast || showPasswordChangeToast) ? 'pointer-events-none' : ''}`}>
            {/* HEADER */}
            <Header
                userName={userData?.user.name || ""}
                onProfileClick={() => setShowProfile((prev) => !prev)}
                onLogout={handleLogout}
                onClaimsClick={() => setActiveTab("reclamos")}
                onDashboardClick={() => setActiveTab("dashboard")}
                activeTab={activeTab}
            />

            {/* MAIN CONTENT CONTAINER */}
            <div className="relative p-8">
                {/* WELCOME SECTION */}
                <div className="mb-12 relative overflow-hidden">
                    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 rounded-3xl p-8 shadow-2xl border border-gray-200">
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/5 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-r from-white to-gray-100 rounded-xl flex items-center justify-center shadow-lg">
                                    <span className="text-2xl">🏢</span>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold text-white mb-2">
                                        ¡Hola, {userData?.user.name}!
                                    </h1>
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        <span className="text-lg">Sistema activo</span>
                                    </div>
                                </div>
                            </div>
                            {/* Features Highlights 
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                            <span className="text-white text-lg">📅</span>
                                        </div>
                                        <h3 className="text-white font-semibold text-lg">Reservas Rápidas</h3>
                                    </div>
                                    <p className="text-gray-300 text-sm">
                                        Selecciona tu amenity favorito y reserva en segundos
                                    </p>
                                </div>
                                
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                                            <span className="text-white text-lg">⚡</span>
                                        </div>
                                        <h3 className="text-white font-semibold text-lg">Estado en Tiempo Real</h3>
                                    </div>
                                    <p className="text-gray-300 text-sm">
                                        Ve la disponibilidad actualizada de todos los espacios
                                    </p>
                                </div>
                                
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                                            <span className="text-white text-lg">📊</span>
                                        </div>
                                        <h3 className="text-white font-semibold text-lg">Gestión Completa</h3>
                                    </div>
                                    <p className="text-gray-300 text-sm">
                                        Administra, cancela y revisa todas tus reservas fácilmente
                                    </p>
                                </div>
                            </div>
                            */}
                        </div>
                    </div>
                </div>

            {/* Mostrar ClaimsPage si activeTab es 'reclamos', sino mostrar el dashboard original */}
            {activeTab === "reclamos" ? (
                <ClaimsPage />
            ) : (
                <>
                    {/* Layout de selección - Amenities a la izquierda, Horario a la derecha */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 items-start">
                        {/* Columna izquierda - Selector de amenities */}
                        <SpaceSelector
                            spaces={amenities}
                            selectedSpace={selectedSpace}
                            onSpaceSelect={setSelectedSpace}
                            selectedDate={selectedDate}
                            selectedTime={selectedTime}
                            getAmenityOccupancy={getAmenityOccupancy}
                            token={token}
                            fetchReservations={async (id) => {
                                if (!token) return [];
                                return getReservationsByAmenity(token, id);
                            }}
                        />

                        {/* Columna derecha - Selector de horario */}
                        <TimeSelector
                            selectedSpace={selectedSpace}
                            selectedTime={selectedTime}
                            selectedDate={selectedDate}
                            amenities={amenities}
                            reservations={reservations}
                            timeError={timeError}
                            getCurrentReservationCount={getCurrentReservationCount}
                            onTimeChange={(newTime) => {
                                const [start, end] = newTime.split(" - ");
                                const space = amenities.find(a => a.name === selectedSpace);
                                const maxDuration = space?.maxDuration || 60;

                                const [sh, sm] = start.split(":").map(Number);
                                const [eh, em] = end.split(":").map(Number);
                                const duration = (eh * 60 + em) - (sh * 60 + sm);

                                if (duration > maxDuration) {
                                    setTimeError(`⛔ La duración máxima para ${selectedSpace} es de ${maxDuration} minutos`);
                                    return;
                                }

                                setSelectedTime(newTime);
                                setTimeError(null);
                            }}
                            onDateChange={setSelectedDate}
                            onReserve={handleReserve}
                            isReserving={isReserving}
                        />
                    </div>

                    {/* Resumen de reservas del usuario - Ancho completo */}
                    <ReservationList
                        reservations={userReservations}
                        onCancelReservation={handleCancelReservation}
                        onRemoveFromView={handleRemoveFromView}
                        cancellingId={isCancelling}
                        hidingId={isHiding}
                    />
                </>
            )}

            {/* PANEL PERFIL (Derecha) */}
            <ProfilePanel
                isVisible={showProfile}
                onClose={() => setShowProfile(false)}
                userName={userData?.user.name || ""}
                onEditProfile={() => setShowEditPopup(true)}
                onChangePassword={() => setShowPasswordPopup(true)}
                onDeleteAccount={handleDeleteAccount}
                onLogout={handleLogout}
            />

            {/* POPUP EDITAR */}
            <EditProfileModal
                isVisible={showEditPopup}
                onClose={() => setShowEditPopup(false)}
                newName={newName}
                onNameChange={setNewName}
                onSave={handleSaveName}
                isSaving={isSavingName}
            />

            {/* POPUP CAMBIAR CONTRASEÑA */}
            <ChangePasswordModal
                isVisible={showPasswordPopup}
                onClose={() => setShowPasswordPopup(false)}
                onSave={handleChangePassword}
            />

            {/* POPUP CONFIRMAR ELIMINACIÓN */}
            <DeleteAccountModal
                isVisible={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                userName={userData?.user.name || ""}
                isDeleting={isDeletingAccount}
            />
            </div> {/* MAIN CONTENT CONTAINER */}

            {/* Cancel Reservation Modal */}
            <CancelReservationModal
                isVisible={showCancelModal}
                onClose={() => {
                    setShowCancelModal(false);
                    setReservationToCancel(null);
                }}
                onConfirm={handleConfirmCancelReservation}
                reservation={reservationToCancel}
                isCancelling={reservationToCancel ? isCancelling === reservationToCancel.id : false}
            />

            {/* Reservation Cancelled Toast */}
            <ReservationCancelledToast
                isVisible={showCancelToast}
                onComplete={() => setShowCancelToast(false)}
            />

            {/* Reservation Hidden Toast */}
            <ReservationHiddenToast
                isVisible={showHiddenToast}
                onComplete={() => setShowHiddenToast(false)}
            />

            {/* Reservation Success Toast */}
            <ReservationSuccessToast
                isVisible={showReservationToast}
                onComplete={() => {
                    setShowReservationToast(false);
                    setSuccessReservationData(null);
                }}
                amenityName={successReservationData?.amenityName}
                timeSlot={successReservationData?.timeSlot}
            />

            {/* Reservation Error Toast */}
            <ReservationErrorToast
                isVisible={showReservationErrorToast}
                onComplete={() => {
                    setShowReservationErrorToast(false);
                    setReservationErrorMessage(null);
                }}
                errorMessage={reservationErrorMessage || undefined}
            />

            {/* Logout Success Toast */}
            <LogoutSuccessToast
                isVisible={showSuccessToast}
                onComplete={handleLogoutComplete}
            />

            {/* Password Change Success Toast */}
            <PasswordChangeSuccessToast
                isVisible={showPasswordChangeToast}
                onComplete={handlePasswordChangeComplete}
            />
            
            {/* General Error Toast */}
            <ReservationErrorToast
                isVisible={showErrorToast}
                errorMessage={errorMessage}
                onComplete={() => {
                    setShowErrorToast(false);
                    setErrorMessage('');
                }}
            />

        </div>
    );
}

export default TenantDashboard;
