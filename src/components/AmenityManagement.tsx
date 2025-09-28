import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Waves, Search, Plus, Edit3, Trash2, Users, Clock, Calendar, X, Eye } from "lucide-react";
import { useToast } from "./Toast";
import { 
    getAdminAmenities, 
    createAmenity, 
    updateAmenity, 
    deleteAmenity,
    getAmenityReservations,
    type AdminAmenity,
    type AdminReservation
} from "../api_calls/admin";

// Helper functions to safely get counts
const getReservationCount = (amenity: AdminAmenity): number => {
    return amenity._count?.reservations ?? amenity.reservationCount ?? 0;
};

const getActiveReservationCount = (amenity: AdminAmenity): number => {
    return amenity._count?.activeReservations ?? amenity.activeReservationCount ?? 0;
};

interface AmenityManagementProps {
    isOpen: boolean;
    onClose: () => void;
    token: string;
}

function AmenityManagement({ isOpen, onClose, token }: AmenityManagementProps) {
    const { showToast } = useToast();
    const [amenities, setAmenities] = useState<AdminAmenity[]>([]);
    const [filteredAmenities, setFilteredAmenities] = useState<AdminAmenity[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showReservationsModal, setShowReservationsModal] = useState(false);
    const [selectedAmenity, setSelectedAmenity] = useState<AdminAmenity | null>(null);
    const [amenityReservations, setAmenityReservations] = useState<AdminReservation[]>([]);
    const [processing, setProcessing] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        capacity: "",
        maxDuration: ""
    });

    useEffect(() => {
        if (isOpen && token) {
            loadAmenities();
        }
    }, [isOpen, token]);

    useEffect(() => {
        // Filtrar amenities
        let filtered = amenities;

        if (searchTerm) {
            filtered = filtered.filter(amenity => 
                amenity.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredAmenities(filtered);
    }, [amenities, searchTerm]);

    const loadAmenities = async () => {
        setLoading(true);
        try {
            const amenitiesData = await getAdminAmenities(token);
            if (Array.isArray(amenitiesData)) {
                setAmenities(amenitiesData);
            } else {
                console.error("Amenities data is not an array:", amenitiesData);
                setAmenities([]);
            }
        } catch (error) {
            console.error("Error loading amenities:", error);
            setAmenities([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAmenity = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        try {
            const amenityData = {
                name: formData.name.trim(),
                capacity: parseInt(formData.capacity),
                maxDuration: parseInt(formData.maxDuration)
            };

            await createAmenity(token, amenityData);
            await loadAmenities();
            setShowCreateModal(false);
            setFormData({ name: "", capacity: "", maxDuration: "" });
            showToast("Amenity creado exitosamente", "success");
        } catch (error) {
            console.error("Error creating amenity:", error);
            showToast(`Error al crear amenity: ${error instanceof Error ? error.message : 'Error desconocido'}`, "error");
        } finally {
            setProcessing(false);
        }
    };

    const handleEditAmenity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAmenity) return;

        setProcessing(true);
        try {
            const updateData: any = {};
            
            if (formData.name.trim() !== selectedAmenity.name) {
                updateData.name = formData.name.trim();
            }
            if (parseInt(formData.capacity) !== selectedAmenity.capacity) {
                updateData.capacity = parseInt(formData.capacity);
            }
            if (parseInt(formData.maxDuration) !== selectedAmenity.maxDuration) {
                updateData.maxDuration = parseInt(formData.maxDuration);
            }

            await updateAmenity(token, selectedAmenity.id, updateData);
            await loadAmenities();
            setShowEditModal(false);
            setSelectedAmenity(null);
            showToast("Amenity actualizado exitosamente", "success");
        } catch (error) {
            console.error("Error updating amenity:", error);
            showToast(`Error al actualizar amenity: ${error instanceof Error ? error.message : 'Error desconocido'}`, "error");
        } finally {
            setProcessing(false);
        }
    };

    const handleDeleteAmenity = async (amenity: AdminAmenity) => {
        const reservationCount = getReservationCount(amenity);
        const activeReservationCount = getActiveReservationCount(amenity);
        
        let confirmMessage = `¿Estás seguro de eliminar el amenity "${amenity.name}"?`;
        if (activeReservationCount > 0) {
            confirmMessage += `\n\nADVERTENCIA: Este amenity tiene ${activeReservationCount} reserva(s) activa(s) y ${reservationCount} reserva(s) en total.`;
        }

        if (!window.confirm(confirmMessage)) return;

        setProcessing(true);
        try {
            await deleteAmenity(token, amenity.id);
            await loadAmenities();
            showToast("Amenity eliminado exitosamente", "success");
        } catch (error) {
            console.error("Error deleting amenity:", error);
            showToast(`Error al eliminar amenity: ${error instanceof Error ? error.message : 'Error desconocido'}`, "error");
        } finally {
            setProcessing(false);
        }
    };

    const handleViewReservations = async (amenity: AdminAmenity) => {
        setSelectedAmenity(amenity);
        setProcessing(true);
        try {
            const result = await getAmenityReservations(token, amenity.id, { limit: 50 });
            setAmenityReservations(result.reservations);
            setShowReservationsModal(true);
        } catch (error) {
            console.error("Error loading amenity reservations:", error);
            showToast(`Error al cargar reservas: ${error instanceof Error ? error.message : 'Error desconocido'}`, "error");
        } finally {
            setProcessing(false);
        }
    };

    const openCreateModal = () => {
        setFormData({ name: "", capacity: "", maxDuration: "" });
        setShowCreateModal(true);
    };

    const openEditModal = (amenity: AdminAmenity) => {
        setSelectedAmenity(amenity);
        setFormData({
            name: amenity.name,
            capacity: amenity.capacity.toString(),
            maxDuration: amenity.maxDuration.toString()
        });
        setShowEditModal(true);
    };

    const formatDuration = (minutes: number): string => {
        if (minutes < 60) {
            return `${minutes} min`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            if (remainingMinutes === 0) {
                return `${hours} h`;
            } else {
                return `${hours}h ${remainingMinutes}m`;
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-cyan-600 to-blue-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Waves className="w-8 h-8 text-white" />
                            <div>
                                <h2 className="text-2xl font-bold text-white">Gestión de Amenities</h2>
                                <p className="text-cyan-100 mt-1">Administrar instalaciones y servicios del edificio</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-cyan-200 transition-colors cursor-pointer"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Controls */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Buscar amenities por nombre..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-full sm:w-80"
                                />
                            </div>
                        </div>

                        {/* Create Button */}
                        <button
                            onClick={openCreateModal}
                            disabled={loading}
                            className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <Plus className="w-5 h-5" />
                            Crear Amenity
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
                        </div>
                    ) : filteredAmenities.length === 0 ? (
                        <div className="text-center py-12">
                            <Waves className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-600 mb-2">No se encontraron amenities</h3>
                            <p className="text-gray-500">
                                {amenities.length === 0 
                                    ? "No hay amenities registrados en el sistema" 
                                    : "Intenta ajustar los filtros de búsqueda"
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredAmenities.map((amenity) => (
                                <motion.div
                                    key={amenity.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                                {amenity.name}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Users className="w-4 h-4" />
                                            <span>Capacidad: {amenity.capacity} persona{amenity.capacity !== 1 ? 's' : ''}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock className="w-4 h-4" />
                                            <span>Duración máx: {formatDuration(amenity.maxDuration)}</span>
                                        </div>

                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>Reservas totales: {getReservationCount(amenity)}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                            <span>Reservas activas: {getActiveReservationCount(amenity)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => handleViewReservations(amenity)}
                                            disabled={processing}
                                            className="flex items-center gap-1 px-3 py-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors disabled:opacity-50 text-sm cursor-pointer"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Reservas
                                        </button>
                                        <button
                                            onClick={() => openEditModal(amenity)}
                                            disabled={processing}
                                            className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 text-sm cursor-pointer"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDeleteAmenity(amenity)}
                                            disabled={processing}
                                            className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 text-sm cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Eliminar
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Create Modal */}
                <AnimatePresence>
                    {showCreateModal && (
                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl"
                            >
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">Crear Nuevo Amenity</h3>
                                
                                <form onSubmit={handleCreateAmenity} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nombre *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                            placeholder="Ej: Piscina, Gimnasio, Salón de eventos"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Capacidad *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            style={{ MozAppearance: 'textfield' }}
                                            placeholder="Número de personas"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Duración máxima (minutos) *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="15"
                                            step="15"
                                            value={formData.maxDuration}
                                            onChange={(e) => setFormData({...formData, maxDuration: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            style={{ MozAppearance: 'textfield' }}
                                            placeholder="Ej: 60, 90, 120"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Duración máxima por reserva en minutos
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 pt-4">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="flex-1 bg-cyan-600 text-white py-2 px-4 rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            {processing ? "Creando..." : "Crear Amenity"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowCreateModal(false)}
                                            disabled={processing}
                                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Edit Modal */}
                <AnimatePresence>
                    {showEditModal && selectedAmenity && (
                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl"
                            >
                                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                                    Editar {selectedAmenity.name}
                                </h3>
                                
                                <form onSubmit={handleEditAmenity} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nombre *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Capacidad *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            style={{ MozAppearance: 'textfield' }}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Duración máxima (minutos) *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="15"
                                            step="15"
                                            value={formData.maxDuration}
                                            onChange={(e) => setFormData({...formData, maxDuration: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            style={{ MozAppearance: 'textfield' }}
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 pt-4">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="flex-1 bg-cyan-600 text-white py-2 px-4 rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            {processing ? "Actualizando..." : "Actualizar"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowEditModal(false)}
                                            disabled={processing}
                                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Reservations Modal */}
                <AnimatePresence>
                    {showReservationsModal && selectedAmenity && (
                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
                            >
                                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-cyan-600 to-blue-700">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-semibold text-white">
                                                Reservas de {selectedAmenity.name}
                                            </h3>
                                            <p className="text-cyan-100">
                                                {amenityReservations.length} reserva{amenityReservations.length !== 1 ? 's' : ''} encontrada{amenityReservations.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setShowReservationsModal(false)}
                                            className="text-white hover:text-cyan-200 transition-colors cursor-pointer"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-auto p-6">
                                    {amenityReservations.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                            <h3 className="text-lg font-medium text-gray-600 mb-2">Sin reservas</h3>
                                            <p className="text-gray-500">
                                                Este amenity no tiene reservas registradas
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {amenityReservations.map((reservation) => (
                                                <div
                                                    key={reservation.id}
                                                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                    reservation.status === 'confirmed' 
                                                                        ? 'bg-green-100 text-green-800' 
                                                                        : reservation.status === 'pending'
                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {reservation.status}
                                                                </span>
                                                            </div>
                                                            <p className="font-medium text-gray-800">
                                                                {reservation.user?.name || 'Usuario desconocido'}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                {reservation.user?.email || 'Email desconocido'}
                                                            </p>
                                                        </div>
                                                        <div className="text-right text-sm text-gray-600">
                                                            <p>
                                                                {new Date(reservation.startTime).toLocaleDateString()} 
                                                            </p>
                                                            <p>
                                                                {new Date(reservation.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                                                                {new Date(reservation.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default AmenityManagement;