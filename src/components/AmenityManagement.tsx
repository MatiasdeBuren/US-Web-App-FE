// Refactored AmenityManagement using ManagementModal pattern
import { Waves, Users, Clock, Edit3, Trash2 } from "lucide-react";
import ManagementModal from "./ManagementModal";
import FormInput from "./FormInput";
import { 
    getAdminAmenities, 
    createAmenity, 
    updateAmenity, 
    deleteAmenity,
    type AdminAmenity
} from "../api_calls/admin";

interface AmenityManagementProps {
    isOpen: boolean;
    onClose: () => void;
    token: string;
}

const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
        return `${minutes} min`;
    } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
    }
};

function AmenityManagement({ isOpen, onClose, token }: AmenityManagementProps) {
    const renderItem = (
        amenity: AdminAmenity, 
        onEdit: (item: AdminAmenity) => void, 
        onDelete: (id: number) => void
    ) => (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="bg-cyan-100 p-3 rounded-xl">
                        <Waves className="w-6 h-6 text-cyan-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">{amenity.name}</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-400" />
                                <span>{amenity.capacity} personas</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span>{formatDuration(amenity.maxDuration)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(amenity)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar amenity"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(amenity.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar amenity"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );

    const renderCreateForm = (
        formData: any, 
        setFormData: (data: any) => void, 
        onSubmit: (e: React.FormEvent) => void,
        processing: boolean
    ) => (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Crear Nuevo Amenity</h3>
            <form onSubmit={onSubmit} className="space-y-4">
                <FormInput
                    label="Nombre"
                    placeholder="Ej: Piscina, Gimnasio, Salón de eventos"
                    value={formData.name}
                    onChange={(value) => setFormData({...formData, name: value})}
                    required
                    disabled={processing}
                />
                
                <FormInput
                    label="Capacidad"
                    placeholder="Número de personas"
                    value={formData.capacity}
                    onChange={(value) => setFormData({...formData, capacity: value})}
                    type="number"
                    min="1"
                    required
                    disabled={processing}
                />
                
                <FormInput
                    label="Duración máxima (minutos)"
                    placeholder="Ej: 120"
                    value={formData.maxDuration}
                    onChange={(value) => setFormData({...formData, maxDuration: value})}
                    type="number"
                    min="15"
                    step="15"
                    required
                    disabled={processing}
                />

                <div className="flex justify-end gap-4 pt-4">
                    <button
                        type="submit"
                        className="px-6 py-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors disabled:opacity-50"
                        disabled={processing}
                    >
                        {processing ? 'Creando...' : 'Crear Amenity'}
                    </button>
                </div>
            </form>
        </div>
    );

    const renderEditForm = (
        item: AdminAmenity,
        formData: any, 
        setFormData: (data: any) => void, 
        onSubmit: (e: React.FormEvent) => void,
        processing: boolean
    ) => (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Editar {item.name}</h3>
            <form onSubmit={onSubmit} className="space-y-4">
                <FormInput
                    label="Nombre"
                    placeholder="Nombre del amenity"
                    value={formData.name}
                    onChange={(value) => setFormData({...formData, name: value})}
                    required
                    disabled={processing}
                />
                
                <FormInput
                    label="Capacidad"
                    placeholder="Número de personas"
                    value={formData.capacity}
                    onChange={(value) => setFormData({...formData, capacity: value})}
                    type="number"
                    min="1"
                    required
                    disabled={processing}
                />
                
                <FormInput
                    label="Duración máxima (minutos)"
                    placeholder="Ej: 120"
                    value={formData.maxDuration}
                    onChange={(value) => setFormData({...formData, maxDuration: value})}
                    type="number"
                    min="15"
                    step="15"
                    required
                    disabled={processing}
                />

                <div className="flex justify-end gap-4 pt-4">
                    <button
                        type="submit"
                        className="px-6 py-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors disabled:opacity-50"
                        disabled={processing}
                    >
                        {processing ? 'Actualizando...' : 'Actualizar Amenity'}
                    </button>
                </div>
            </form>
        </div>
    );

    return (
        <ManagementModal<AdminAmenity>
            title="Amenities"
            isOpen={isOpen}
            onClose={onClose}
            token={token}
            loadItems={getAdminAmenities}
            createItem={createAmenity}
            updateItem={updateAmenity}
            deleteItem={deleteAmenity}
            renderItem={renderItem}
            renderCreateForm={renderCreateForm}
            renderEditForm={renderEditForm}
            searchFields={['name']}
            initialFormData={{ name: "", capacity: "", maxDuration: "" }}
            getFormDataFromItem={(amenity) => ({
                name: amenity.name,
                capacity: amenity.capacity.toString(),
                maxDuration: amenity.maxDuration.toString()
            })}
            createButtonText="Crear Amenity"
            emptyStateMessage="No hay amenities registrados"
        />
    );
}

export default AmenityManagement;