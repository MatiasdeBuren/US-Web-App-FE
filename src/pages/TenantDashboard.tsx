import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { createReservation } from "../api_calls/post_reservation";

import { getReservationsByAmenity } from "../api_calls/get_amenity_reservations";
import { updateUserName } from "../api_calls/update_user_name";
import { updateUserPassword } from "../api_calls/update_user_password";
import { deleteUser } from "../api_calls/delete_user";
import { cancelReservation } from "../api_calls/cancel_reservation";
import { hideReservationFromUser } from "../api_calls/hide_reservation";
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
import useUserNotifications from "../hooks/useUserNotifications";
import useNotificationToasts from "../hooks/useNotificationToasts";
import { NotificationToastContainer } from "../components/NotificationToast";
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
    const [activeTab, setActiveTab] = useState<"dashboard" | "reclamos">("dashboard");
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isReserving, setIsReserving] = useState(false);
    const [isCancelling, setIsCancelling] = useState<number | null>(null);
    const [isHiding, setIsHiding] = useState<number | null>(null);
    const [isSavingName, setIsSavingName] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null);
    const [showCancelToast, setShowCancelToast] = useState(false);
    const [showHiddenToast, setShowHiddenToast] = useState(false);
    const [showReservationToast, setShowReservationToast] = useState(false);
    const [showErrorToast, setShowErrorToast] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successReservationData, setSuccessReservationData] = useState<{ amenityName: string; timeSlot: string } | null>(null);
    const [showReservationErrorToast, setShowReservationErrorToast] = useState(false);
    const [reservationErrorMessage, setReservationErrorMessage] = useState<string | null>(null);

    const { toasts, removeToast, addToast } = useNotificationToasts();
    
    const {
        notifications: userNotifications,
        unreadCount: userUnreadCount,
        markAsRead: markUserNotificationAsRead,
        markAllAsRead: markAllUserNotificationsAsRead,
        deleteNotification: deleteUserNotification,
        refresh: refreshUserNotifications
    } = useUserNotifications({ 
        token: token || null,
        onNewNotification: (notification) => {
            const getToastType = (notifType: string) => {
                switch (notifType) {
                    case 'reservation_confirmed':
                        return 'new_notification' as const;
                    case 'reservation_reminder':
                        return 'new_notification' as const;
                    case 'reservation_cancelled':
                        return 'urgent_notification' as const;
                    case 'reservation_modified':
                        return 'urgent_notification' as const;
                    default:
                        return 'new_notification' as const;
                }
            };

            addToast({
                type: getToastType(notification.type),
                title: notification.title,
                message: notification.message,
                duration: 5000
            });
        }
    });

    const fetchReservations = useCallback(async (id: number) => {
        if (!token) return [];
        return getReservationsByAmenity(token, id);
    }, [token]);

    const getCurrentReservationCount = useCallback(async (amenityName: string, date: string, timeSlot: string): Promise<number> => {
        if (!token) return 0;
        
        const amenity = amenities.find(a => a.name === amenityName);
        if (!amenity) return 0;

        try {
            const [startTimeStr, endTimeStr] = timeSlot.split(" - ");
            if (!startTimeStr || !endTimeStr) return 0;

            const buildTimestampFromUserTime = (dateStr: string, timeStr: string): string => {
                const [hours, minutes] = timeStr.split(':').map(Number);
                
                const [year, month, day] = dateStr.split('-').map(Number);
                const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
                
                return localDate.toISOString();
            };

            const utcSlotStart = new Date(buildTimestampFromUserTime(date, startTimeStr));
            const utcSlotEnd = new Date(buildTimestampFromUserTime(date, endTimeStr));

            const reservations = await getReservationsByAmenity(token, amenity.id, date, date);
            
            if (reservations.length === 0) {
                return 0;
            }
            
            let count = 0;
            reservations.forEach(reservation => {
                const resStart = new Date(reservation.startTime);
                const resEnd = new Date(reservation.endTime);

                const hasOverlap = resStart < utcSlotEnd && resEnd > utcSlotStart;
                
                if (hasOverlap) {
                    count++;
                }
            });

            return count;
        } catch (error) {
            console.error('Error calculating reservation count:', error);
            return 0;
        }
    }, [token, amenities]);

    const getAmenityOccupancy = useCallback(async (amenityName: string, date: string, timeSlot: string): Promise<number> => {
        if (!token) return 0;
        
        const amenity = amenities.find(a => a.name === amenityName);
        if (!amenity) return 0;

        try {
            const currentReservations = await getCurrentReservationCount(amenityName, date, timeSlot);
            const occupancyPercentage = (currentReservations / amenity.capacity) * 100;
            return Math.min(100, occupancyPercentage);
        } catch (error) {
            console.error('Error calculating amenity occupancy:', error);
            return 0;
        }
    }, [amenities, getCurrentReservationCount]);

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
            if (dashboardData && dashboardData.user) {
                setUserData(dashboardData);
                setNewName(dashboardData.user.name);
            }
            if (Array.isArray(amenitiesData)) {
                setAmenities(amenitiesData);
            }
        })
        .catch((error) => {
            console.error('Error loading dashboard data:', error);
            setUserData(null);
            setAmenities([]);
        })
        .finally(() => {
            setIsInitialLoading(false);
        });
    }, []);

    useEffect(() => {
        if (amenities.length > 0) {
            setSelectedSpace(amenities[0].name);
            
            if (!selectedDate) {
                const today = new Date();
                const formattedDate = today.toISOString().split('T')[0];
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
        setTimeError(null);
        
        const buildTimestampFromUserTime = (dateStr: string, timeStr: string): string => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            
            const [year, month, day] = dateStr.split('-').map(Number);
            const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
            
            return localDate.toISOString();
        };
        
        try {
            const [startStr, endStr] = selectedTime.split(" - ");
            
            const selectedAmenity = amenities.find((a) => a.name === selectedSpace);
            if (!selectedAmenity) {
                setTimeError("❌ Amenity no encontrado");
                setIsReserving(false);
                return;
            }

            if (selectedAmenity.isActive === false) {
                setTimeError("❌ Este amenity no está disponible actualmente");
                setIsReserving(false);
                return;
            }

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
            
            const [year, month, day] = selectedDate.split('-').map(Number);
            const baseDate = new Date(year, month - 1, day);
            const startDateTime = new Date(baseDate);
            const endDateTime = new Date(baseDate);

            const [sh, sm] = startStr.split(":").map(Number);
            const [eh, em] = endStr.split(":").map(Number);
            startDateTime.setHours(sh, sm, 0, 0);
            endDateTime.setHours(eh, em, 0, 0);

            const currentTime = new Date();
            if (startDateTime < currentTime) {
                setTimeError("❌ No puedes hacer una reserva para una hora que ya ha pasado");
                setIsReserving(false);
                return;
            }

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

            setReservations((prev) => ({
                ...prev,
                [selectedSpace]: {
                    ...prev[selectedSpace],
                    [selectedTime]: (prev[selectedSpace][selectedTime] || 0) + 1,
                },
            }));

            const newReservation: Reservation = {
                id: reservationData.id || reservationData.reservation?.id || Date.now(),
                startTime: buildTimestampFromUserTime(selectedDate, startStr),
                endTime: buildTimestampFromUserTime(selectedDate, endStr),
                status: reservationData.status || reservationData.reservation?.status,
                amenity: {
                    id: amenity.id,
                    name: amenity.name,
                }
            };

            setUserReservations((prev) => [newReservation, ...prev]);

            setTimeError(null);
            
            if (newReservation.status.name !== 'pendiente') {
                setSuccessReservationData({
                    amenityName: selectedSpace,
                    timeSlot: selectedTime
                });
                setShowReservationToast(true);
            }

            refreshUserNotifications();

        } catch (err: any) {
            setReservationErrorMessage(err.message || "Error al procesar la reserva");
            setShowReservationErrorToast(true);
            setTimeError(null);
        } finally {
            setIsReserving(false);
        }
    };
    const handleCancelReservation = (reservationId: number) => {
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
            setUserReservations(prev =>
                prev.map(r => r.id === reservationToCancel.id ? { ...r, status: { id: 3, name: "cancelada", label: "Cancelada" } } : r)
            );
            
            setShowCancelModal(false);
            setShowCancelToast(true);

            refreshUserNotifications();
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
            await hideReservationFromUser(token, reservationId);
            
            setUserReservations(prev =>
                prev.filter(r => r.id !== reservationId)
            );
            
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

    const handleLogout = () => {
        setShowProfile(false);
        setShowSuccessToast(true);
    };

    const handleLogoutComplete = () => {
        setShowSuccessToast(false);
        localStorage.removeItem("token");
        window.location.replace("/#/login");
    };

    const handlePasswordChangeComplete = () => {
        setShowPasswordChangeToast(false);
        localStorage.removeItem("token");
        window.location.href = "/#/login";
    };

    const handleDeleteAccount = () => {
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        if (!token || isDeletingAccount) return;

        setIsDeletingAccount(true);
        try {
            await deleteUser(token);
            localStorage.removeItem("token");
            setShowDeleteConfirm(false);
            setShowProfile(false);
            setShowSuccessToast(true);
            
            setTimeout(() => {
                window.location.replace("/#/login");
            }, 2000);
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
                userId={userData?.user.id || 0}
                onProfileClick={() => setShowProfile((prev) => !prev)}
                onLogout={handleLogout}
                onClaimsClick={() => setActiveTab("reclamos")}
                onDashboardClick={() => setActiveTab("dashboard")}
                activeTab={activeTab}
                userNotifications={userNotifications}
                userUnreadCount={userUnreadCount}
                onMarkUserNotificationAsRead={markUserNotificationAsRead}
                onMarkAllUserNotificationsAsRead={markAllUserNotificationsAsRead}
                onDeleteUserNotification={deleteUserNotification}
                onUserNotificationClick={(notification) => {
                    console.log('Notificación clickeada:', notification);
                }}
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
                            fetchReservations={fetchReservations}
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

            {/* Notification Toasts */}
            <NotificationToastContainer
                toasts={toasts}
                onRemoveToast={removeToast}
            />

        </div>
    );
}

export default TenantDashboard;
