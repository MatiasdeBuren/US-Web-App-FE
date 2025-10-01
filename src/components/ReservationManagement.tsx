import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Search, Filter, Clock, User, Building, Eye } from "lucide-react";
import { getAdminReservations, type AdminReservation } from "../api_calls/admin";

interface ReservationManagementProps {
    isOpen: boolean;
    onClose: () => void;
    token: string;
}

function ReservationManagement({ isOpen, onClose, token }: ReservationManagementProps) {
    const [reservations, setReservations] = useState<AdminReservation[]>([]);
    const [filteredReservations, setFilteredReservations] = useState<AdminReservation[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    useEffect(() => {
        if (isOpen && token) {
            loadReservations();
        }
    }, [isOpen, token]);

    useEffect(() => {
        // Filtrar reservas basado en búsqueda y status
        let filtered = reservations;

        if (searchTerm) {
            filtered = filtered.filter(reservation => 
                reservation.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                reservation.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                reservation.amenity?.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterStatus !== "all") {
            filtered = filtered.filter(reservation => reservation.status === filterStatus);
        }

        // Ordenar por fecha de creación (más recientes primero)
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setFilteredReservations(filtered);
    }, [reservations, searchTerm, filterStatus]);

    const loadReservations = async () => {
        setLoading(true);
        try {
            const reservationsData = await getAdminReservations(token, { limit: 100 });
            // Asegurar que siempre sea un array
            if (Array.isArray(reservationsData)) {
                setReservations(reservationsData);
            } else {
                console.error("Reservations data is not an array:", reservationsData);
                setReservations([]);
            }
        } catch (error) {
            console.error("Error loading reservations:", error);
            setReservations([]); // Establecer array vacío en caso de error
            // Mostrar error pero no bloquear la UI
            console.warn("Failed to load reservations, showing empty list");
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case "confirmed": return "bg-green-100 text-green-800 border-green-300";
            case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-300";
            case "cancelled": return "bg-red-100 text-red-800 border-red-300";
            default: return "bg-gray-100 text-gray-800 border-gray-300";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "confirmed": return "✅";
            case "pending": return "⏳";
            case "cancelled": return "❌";
            default: return "❓";
        }
    };

    const formatDateTime = (dateString: string) => {
        // Parse timestamps as local time (no timezone conversion)
        const parseLocalDateTime = (timestamp: string) => {
            const [datePart, timePart] = timestamp.split('T');
            const [time] = timePart.split('.');
            const [hours, minutes] = time.split(':').map(Number);
            return {
                datePart,
                hours,
                minutes
            };
        };

        const parsed = parseLocalDateTime(dateString);
        const date = new Date(parsed.datePart); // Only use date part for date formatting
        
        return {
            date: date.toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
            }),
            time: `${String(parsed.hours).padStart(2, '0')}:${String(parsed.minutes).padStart(2, '0')}`
        };
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-2xl shadow-2xl p-8 max-w-7xl w-full max-h-[90vh] mx-4 overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Gestión de Reservas</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Buscar por usuario, email o amenity..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            >
                                <option value="all">Todos los estados</option>
                                <option value="confirmed">Confirmadas</option>
                                <option value="pending">Pendientes</option>
                                <option value="cancelled">Canceladas</option>
                            </select>
                        </div>
                    </div>

                    {/* Reservations List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center items-center h-40">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredReservations.map((reservation) => {
                                    const startTime = formatDateTime(reservation.startTime);
                                    const endTime = formatDateTime(reservation.endTime);
                                    const createdAt = formatDateTime(reservation.createdAt);
                                    
                                    return (
                                        <motion.div
                                            key={reservation.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h3 className="text-lg font-semibold text-gray-800">
                                                                    {reservation.amenity?.name || 'Amenidad desconocida'}
                                                                </h3>
                                                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(reservation.status)}`}>
                                                                    <span>{getStatusIcon(reservation.status)}</span>
                                                                    {reservation.status}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                                                <div className="flex items-center gap-1">
                                                                    <User className="w-4 h-4" />
                                                                    <span>{reservation.user?.name || 'Usuario desconocido'}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <span>📧</span>
                                                                    <span>{reservation.user?.email || 'Email desconocido'}</span>
                                                                </div>
                                                                {reservation.user && reservation.user.apartment && (
                                                                    <div className="flex items-center gap-1">
                                                                        <Building className="w-4 h-4" />
                                                                        <span>Apt: {reservation.user.apartment.unit}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4 text-green-500" />
                                                            <div>
                                                                <span className="text-gray-500">Inicio:</span>
                                                                <div className="font-medium">{startTime.date} {startTime.time}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4 text-red-500" />
                                                            <div>
                                                                <span className="text-gray-500">Fin:</span>
                                                                <div className="font-medium">{endTime.date} {endTime.time}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Eye className="w-4 h-4 text-blue-500" />
                                                            <div>
                                                                <span className="text-gray-500">Creada:</span>
                                                                <div className="font-medium">{createdAt.date} {createdAt.time}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                
                                {filteredReservations.length === 0 && !loading && (
                                    <div className="text-center py-12">
                                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500 text-lg">No se encontraron reservas</p>
                                        <p className="text-gray-400">Intenta ajustar los filtros de búsqueda</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Stats Footer */}
                    <div className="border-t border-gray-200 pt-4 mt-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-orange-600">{Array.isArray(reservations) ? reservations.length : 0}</div>
                                <div className="text-sm text-gray-500">Total Reservas</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-green-600">{Array.isArray(reservations) ? reservations.filter(r => r.status === 'confirmed').length : 0}</div>
                                <div className="text-sm text-gray-500">Confirmadas</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-yellow-600">{Array.isArray(reservations) ? reservations.filter(r => r.status === 'pending').length : 0}</div>
                                <div className="text-sm text-gray-500">Pendientes</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-red-600">{Array.isArray(reservations) ? reservations.filter(r => r.status === 'cancelled').length : 0}</div>
                                <div className="text-sm text-gray-500">Canceladas</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export default ReservationManagement;