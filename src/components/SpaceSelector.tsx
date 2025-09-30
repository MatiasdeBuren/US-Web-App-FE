import { ChevronRight, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import type { Amenity } from "../types";
import AvailabilityViewer from "./reservation_available_dates";

interface SpaceSelectorProps {
    spaces: Amenity[];
    selectedSpace: string;
    onSpaceSelect: (spaceName: string) => void;
    selectedDate: string;
    selectedTime: string;
    getAmenityOccupancy: (amenityName: string, date: string, timeSlot: string) => Promise<number>;
    token: string;
    fetchReservations: (id: number) => Promise<any[]>;
}

function SpaceSelector({ 
    spaces, 
    selectedSpace, 
    onSpaceSelect, 
    selectedDate,
    selectedTime,
    getAmenityOccupancy,
    fetchReservations
}: SpaceSelectorProps) {
    // State to store occupancy percentages for each amenity
    const [occupancyData, setOccupancyData] = useState<{ [amenityName: string]: number }>({});
    const [loadingOccupancy, setLoadingOccupancy] = useState(false);

    // Update occupancy data when date or time changes
    useEffect(() => {
        const updateOccupancyData = async () => {
            if (!selectedDate || !selectedTime) return;
            
            setLoadingOccupancy(true);
            const newOccupancyData: { [amenityName: string]: number } = {};

            try {
                // Calculate occupancy for each amenity
                for (const space of spaces) {
                    const occupancy = await getAmenityOccupancy(space.name, selectedDate, selectedTime);
                    newOccupancyData[space.name] = occupancy;
                }
                setOccupancyData(newOccupancyData);
            } catch (error) {
                console.error('Error updating occupancy data:', error);
            } finally {
                setLoadingOccupancy(false);
            }
        };

        updateOccupancyData();
    }, [selectedDate, selectedTime, spaces, getAmenityOccupancy]);
    return (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 h-full">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MapPin className="w-6 h-6 text-gray-600" />
                        <div>
                            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                Amenities
                            </h2>
                            <p className="text-gray-600 text-lg mt-2">Selecciona un espacio para reservar</p>
                        </div>
                    </div>
                    
                    {/* Timeline Button */}
                    {selectedSpace && (() => {
                        const amenity = spaces.find(a => a.name === selectedSpace);
                        if (!amenity) return null;

                        return (
                            <AvailabilityViewer
                                amenityId={amenity.id}
                                amenityName={selectedSpace}
                                capacity={amenity.capacity || 1}
                                openTime={amenity.openTime}
                                closeTime={amenity.closeTime}
                                isLoading={false}
                                fetchReservations={fetchReservations}
                            />
                        );
                    })()}
                </div>
            </div>

            {/* Amenities List */}
            <div className="space-y-6 max-h-[480px] sm:max-h-[560px] md:max-h-[640px] lg:max-h-[720px] overflow-y-auto pr-2 scrollbar-hidden">
                {spaces.filter(space => space.isActive !== false).map((space) => (
                    <div
                        key={space.name}
                        className={`p-6 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                            selectedSpace === space.name 
                                ? "bg-gray-800 text-white shadow-lg" 
                                : "bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => onSpaceSelect(space.name)}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold mb-2">{space.name}</h3>
                                <div className="space-y-2">
                                    <p className={`text-sm font-medium ${
                                        selectedSpace === space.name ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                        Capacidad: {space.capacity || 'N/A'}
                                    </p>
                                    <p className={`text-sm font-medium ${
                                        selectedSpace === space.name ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                        Duración máx: {space.maxDuration || 60} min
                                    </p>
                                    {(space.openTime || space.closeTime) && (
                                        <p className={`text-sm font-medium ${
                                            selectedSpace === space.name ? 'text-gray-300' : 'text-gray-600'
                                        }`}>
                                            Horario: {space.openTime || '00:00'} - {space.closeTime || '23:59'}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {selectedSpace === space.name && (
                                <ChevronRight className="w-6 h-6 text-white" />
                            )}
                        </div>
                        
                        {/* Progress indicator for occupancy */}
                        <div className="mt-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className={`text-xs font-medium ${
                                    selectedSpace === space.name ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                    {loadingOccupancy ? 'Calculando...' : 
                                     `Ocupación: ${Math.round(occupancyData[space.name] || 0)}%`}
                                </span>
                                <span className={`text-xs ${
                                    selectedSpace === space.name ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                    {space.capacity} personas máx.
                                </span>
                            </div>
                            <div className={`w-full bg-gray-200 rounded-full h-3 ${
                                selectedSpace === space.name ? 'bg-gray-600' : ''
                            }`}>
                                <div 
                                    className={`h-3 rounded-full transition-all duration-500 ${
                                        selectedSpace === space.name 
                                            ? 'bg-white' 
                                            : occupancyData[space.name] > 80 
                                                ? 'bg-red-500' 
                                                : occupancyData[space.name] > 50 
                                                    ? 'bg-yellow-500' 
                                                    : 'bg-green-500'
                                    }`}
                                    style={{ 
                                        width: `${loadingOccupancy ? 0 : (occupancyData[space.name] || 0)}%` 
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SpaceSelector;