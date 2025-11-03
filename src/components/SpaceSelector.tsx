import { ChevronRight, MapPin, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import type { Amenity } from "../types";
import AvailabilityViewer from "./reservation_available_dates";
import AmenityRatingStats from "./AmenityRatingStats";
import AmenityReviews from "./AmenityReviews";
import RatingModal from "./RatingModal";
import { getAmenityRatings, type AmenityRatingsResponse, checkCanRate } from "../api_calls/ratings";

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
    const [occupancyData, setOccupancyData] = useState<{ [amenityName: string]: number }>({});
    const [loadingOccupancy, setLoadingOccupancy] = useState(false);
    const [ratingsData, setRatingsData] = useState<{ [amenityId: number]: AmenityRatingsResponse }>({});
    const [showReviewsModal, setShowReviewsModal] = useState(false);
    const [selectedAmenityForReviews, setSelectedAmenityForReviews] = useState<number | null>(null);

    useEffect(() => {
        const updateOccupancyData = async () => {
            if (!selectedDate || !selectedTime) return;
            
            setLoadingOccupancy(true);
            const newOccupancyData: { [amenityName: string]: number } = {};

            try {
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

    useEffect(() => {
        const loadRatings = async () => {
            const newRatingsData: { [amenityId: number]: AmenityRatingsResponse } = {};

            try {
                for (const space of spaces) {
                    const ratings = await getAmenityRatings(space.id);
                    newRatingsData[space.id] = ratings;
                }
                setRatingsData(newRatingsData);
            } catch (error) {
                console.error('Error loading ratings:', error);
            }
        };

        loadRatings();
    }, [spaces]);
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
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-bold">{space.name}</h3>
                                    {ratingsData[space.id] && ratingsData[space.id].stats.totalRatings > 0 && (
                                        <AmenityRatingStats 
                                            stats={ratingsData[space.id].stats}
                                            compact={true}
                                        />
                                    )}
                                    {space.requiresApproval && (
                                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                            selectedSpace === space.name 
                                                ? 'bg-amber-500 text-white' 
                                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                                        }`}>
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                            </svg>
                                            Requiere aprobación
                                        </div>
                                    )}
                                </div>
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
                                    {ratingsData[space.id] && ratingsData[space.id].stats.totalRatings > 0 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedAmenityForReviews(space.id);
                                                setShowReviewsModal(true);
                                            }}
                                            className={`text-sm font-medium flex items-center gap-1 hover:underline ${
                                                selectedSpace === space.name ? 'text-gray-300' : 'text-blue-600'
                                            }`}
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            Ver reseñas
                                        </button>
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

            {showReviewsModal && selectedAmenityForReviews && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowReviewsModal(false)}
                >
                    <div 
                        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-800">
                                Reseñas de {spaces.find(s => s.id === selectedAmenityForReviews)?.name}
                            </h2>
                            <button
                                onClick={() => setShowReviewsModal(false)}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                            <AmenityReviews 
                                amenityId={selectedAmenityForReviews}
                                amenityName={spaces.find(s => s.id === selectedAmenityForReviews)?.name || ''}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SpaceSelector;