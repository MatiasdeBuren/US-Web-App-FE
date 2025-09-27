import { useState, useEffect } from "react";
import type { ReservationData, Amenity } from "../types";
import { LoadingButton } from "./LoadingSpinner";
import { Calendar, Users } from "lucide-react";
import ModernDatePicker from "./ModernDatePicker";
import ModernTimePicker from "./ModernTimePicker";

interface TimeSelectorProps {
    selectedSpace: string;
    selectedTime: string;
    selectedDate: string;
    amenities: Amenity[];
    reservations: ReservationData;
    timeError: string | null;
    onTimeChange: (newTime: string) => void;
    onDateChange: (newDate: string) => void;
    onReserve: () => void;
    isReserving?: boolean;
    // New prop to get real-time reservation count
    getCurrentReservationCount?: (amenityName: string, date: string, timeSlot: string) => Promise<number>;
}

function TimeSelector({
    selectedSpace,
    selectedTime,
    selectedDate,
    amenities,
    timeError,
    onTimeChange,
    onDateChange,
    onReserve,
    isReserving = false,
    getCurrentReservationCount
}: TimeSelectorProps) {
    const [currentReservationCount, setCurrentReservationCount] = useState<number>(0);
    const [isLoadingCount, setIsLoadingCount] = useState(false);
    
    const selectedAmenity = amenities.find(a => a.name === selectedSpace);
    const maxDuration = selectedAmenity?.maxDuration || 60;
    
    // Update reservation count when date, time, or space changes
    useEffect(() => {
        const updateReservationCount = async () => {
            if (getCurrentReservationCount && selectedSpace && selectedDate && selectedTime) {
                setIsLoadingCount(true);
                try {
                    const count = await getCurrentReservationCount(selectedSpace, selectedDate, selectedTime);
                    setCurrentReservationCount(count);
                } catch (error) {
                    console.error('Error fetching reservation count:', error);
                    setCurrentReservationCount(0);
                } finally {
                    setIsLoadingCount(false);
                }
            } else {
                setCurrentReservationCount(0);
            }
        };

        updateReservationCount();
    }, [selectedSpace, selectedDate, selectedTime, getCurrentReservationCount]);

    return (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 h-full">
            <div className="text-center mb-8">
                <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Selecciona tu Horario
                </h2>
                <p className="text-gray-600 text-lg">Elige la fecha y hora perfecta para tu reserva</p>
            </div>

            <div className="space-y-6">
                {/* Modern Date Picker */}
                <ModernDatePicker
                    selectedDate={selectedDate}
                    onDateChange={onDateChange}
                    label="Fecha de Reserva"
                    minDate={new Date().toISOString().split('T')[0]} // Can't select past dates
                />

                {/* Modern Time Picker */}
                <ModernTimePicker
                    selectedTime={selectedTime}
                    onTimeChange={onTimeChange}
                    maxDuration={maxDuration}
                    selectedDate={selectedDate}
                    label="Horario de Reserva"
                />

                {/* Error */}
                {timeError && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                        <p className="text-red-700 font-medium">{timeError}</p>
                    </div>
                )}

                {/* Info adicional */}
                <div className="grid grid-cols-1 gap-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Duración máxima</span>
                        <span className="font-bold text-gray-800">{selectedAmenity?.maxDuration} min</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Reservas actuales
                        </span>
                        <span className="font-bold text-gray-800">
                            {isLoadingCount ? (
                                <span className="animate-pulse">...</span>
                            ) : (
                                currentReservationCount
                            )}
                        </span>
                    </div>
                </div>

                {/* Botón reservar */}
                <div className="pt-4">
                    <LoadingButton
                        onClick={onReserve}
                        loading={isReserving}
                        className="w-full py-5 bg-gradient-to-r from-gray-800 to-gray-600 hover:from-gray-900 hover:to-gray-700 text-white text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
                        loadingText="Reservando..."
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Reservar {selectedSpace}
                        </span>
                    </LoadingButton>
                </div>
            </div>
        </div>
    );
}

export default TimeSelector;