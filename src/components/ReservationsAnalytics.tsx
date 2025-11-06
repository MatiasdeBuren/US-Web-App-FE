import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Clock,
  Calendar,
  TrendingUp,
  Activity,
  Filter,
  ChevronDown,
  CalendarDays
} from 'lucide-react';
import { getAdminReservations } from '../api_calls/admin';
import DateFilterModal, { type DateFilterOption } from './DateFilterModal';
import AmenityFilterModal from './AmenityFilterModal';

interface TimeSlot {
  hour: number;
  count: number;
  label: string;
}

interface AmenityStats {
  id: number;
  name: string;
  totalReservations: number;
  peakHours: TimeSlot[];
  utilizationRate: number;
  averageDuration: number;
}

interface HourlyData {
  hour: string;
  count: number;
  amenities: { [key: string]: number };
}

interface ReservationsAnalyticsProps {
  token: string;
}

const ReservationsAnalytics: React.FC<ReservationsAnalyticsProps> = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [amenityStats, setAmenityStats] = useState<AmenityStats[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [allReservations, setAllReservations] = useState<any[]>([]);
  const [selectedAmenity, setSelectedAmenity] = useState<string>('all');
  const [dateFilterOption, setDateFilterOption] = useState<DateFilterOption | null>(null);
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);
  const [showAmenityFilterModal, setShowAmenityFilterModal] = useState(false);
  const [availableAmenities, setAvailableAmenities] = useState<Array<{id: number, name: string}>>([]);

  const processAndSetData = React.useCallback((reservations: any[]) => {
    let filteredReservations = [...reservations];

    if (selectedAmenity !== 'all') {
      filteredReservations = filteredReservations.filter(r =>
        r.amenity?.name === selectedAmenity
      );
    }

    if (dateFilterOption && dateFilterOption.value !== 'all') {
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      switch (dateFilterOption.value) {
        case 'today': {
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
          break;
        }
        case 'last-7-days': {
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        }
        case 'this-month': {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        }
        case 'last-30-days': {
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        }
        case 'last-90-days': {
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 90);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        }
        case 'this-year': {
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear() + 1, 0, 0, 23, 59, 59, 999);
          break;
        }
        case 'custom': {
          if (dateFilterOption.startDate && dateFilterOption.endDate) {
            startDate = new Date(dateFilterOption.startDate);
            endDate = new Date(dateFilterOption.endDate);
            endDate.setHours(23, 59, 59, 999);
          }
          break;
        }
      }

      if (startDate && endDate) {
        filteredReservations = filteredReservations.filter(reservation => {
          const reservationDate = new Date(reservation.startTime);
          return reservationDate >= startDate! && reservationDate <= endDate!;
        });
      }
    }

    console.log('[ANALYTICS] Filtered to', filteredReservations.length, 'reservations');

    const processedStats = processReservationData(filteredReservations);
    const processedHourly = processHourlyData(filteredReservations);

    setAmenityStats(processedStats);
    setHourlyData(processedHourly);
  }, [selectedAmenity, dateFilterOption]);

  const loadAnalyticsData = React.useCallback(async () => {
    try {
      setLoading(true);
      console.log('[ANALYTICS] Loading reservations data...');

      const reservations = await getAdminReservations(token, { limit: 1000 });
      console.log('[ANALYTICS] Processing', reservations.length, 'reservations');
      setAllReservations(reservations);

      const uniqueAmenities = Array.from(
        new Set(reservations.map(r => r.amenity?.id).filter(Boolean))
      ).map(id => {
        const reservation = reservations.find(r => r.amenity?.id === id);
        return {
          id: id!,
          name: reservation?.amenity?.name || 'Desconocido'
        };
      });
      setAvailableAmenities(uniqueAmenities);
      processAndSetData(reservations);
    } catch (error) {
      console.error('[ANALYTICS] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [token, processAndSetData]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  useEffect(() => {
    if (allReservations.length > 0) {
      processAndSetData(allReservations);
    }
  }, [selectedAmenity, dateFilterOption, allReservations, processAndSetData]);

  const processReservationData = (reservations: any[]): AmenityStats[] => {
    const amenityMap = new Map<string, any>();

    reservations.forEach(reservation => {
      const amenityName = reservation.amenity?.name || 'Desconocido';
      const startTime = new Date(reservation.startTime);
      const endTime = new Date(reservation.endTime);
      const hour = startTime.getHours();
      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

      if (!amenityMap.has(amenityName)) {
        amenityMap.set(amenityName, {
          id: reservation.amenity?.id || 0,
          name: amenityName,
          totalReservations: 0,
          hourlyCount: new Array(24).fill(0),
          totalDuration: 0,
          reservations: []
        });
      }

      const stats = amenityMap.get(amenityName);
      stats.totalReservations++;
      stats.hourlyCount[hour]++;
      stats.totalDuration += duration;
      stats.reservations.push(reservation);
    });

    const result: AmenityStats[] = Array.from(amenityMap.values()).map(stats => {
      const hourlyWithIndex = stats.hourlyCount.map((count: number, hour: number) => ({ hour, count }));
      const peakHours = hourlyWithIndex
        .sort((a: { hour: number; count: number }, b: { hour: number; count: number }) => b.count - a.count)
        .slice(0, 3)
        .filter((h: { hour: number; count: number }) => h.count > 0)
        .map((h: { hour: number; count: number }) => ({
          ...h,
          label: `${h.hour.toString().padStart(2, '0')}:00`
        }));

      const utilizationRate = stats.totalReservations > 0 ? Math.min((stats.totalReservations / 30) * 100, 100) : 0;
      const averageDuration = stats.totalReservations > 0 ? stats.totalDuration / stats.totalReservations : 0;

      return {
        id: stats.id,
        name: stats.name,
        totalReservations: stats.totalReservations,
        peakHours,
        utilizationRate: Math.round(utilizationRate),
        averageDuration: Math.round(averageDuration * 10) / 10
      };
    });

    return result.sort((a, b) => b.totalReservations - a.totalReservations);
  };

  const processHourlyData = (reservations: any[]): HourlyData[] => {
    const hourlyMap = new Map<number, any>();

    for (let hour = 0; hour < 24; hour++) {
      hourlyMap.set(hour, {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        count: 0,
        amenities: {}
      });
    }

    reservations.forEach(reservation => {
      const hour = new Date(reservation.startTime).getHours();
      const amenityName = reservation.amenity?.name || 'Desconocido';
      const data = hourlyMap.get(hour);
      if (data) {
        data.count++;
        data.amenities[amenityName] = (data.amenities[amenityName] || 0) + 1;
      }
    });

    return Array.from(hourlyMap.values());
  };

  const getPeakHour = (): string => {
    if (hourlyData.length === 0) return '--:--';
    const peak = hourlyData.reduce((max, curr) => curr.count > max.count ? curr : max, hourlyData[0]);
    return peak.hour;
  };

  const getCurrentDateLabel = (): string => {
    if (!dateFilterOption || dateFilterOption.value === 'all') return 'Todas las fechas';
    if (dateFilterOption.value === 'custom' && dateFilterOption.startDate && dateFilterOption.endDate) {
      const start = new Date(dateFilterOption.startDate).toLocaleDateString('es-ES');
      const end = new Date(dateFilterOption.endDate).toLocaleDateString('es-ES');
      return `${start} - ${end}`;
    }
    return dateFilterOption.label;
  };

  const getCurrentAmenityLabel = (): string => {
    return selectedAmenity === 'all' ? 'Todos los amenities' : selectedAmenity;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Filters */}
        <div className="flex gap-4 items-center">
          <h3 className="text-lg font-medium text-gray-900">Filtros</h3>

          <div className="flex gap-2 ml-auto">
            {/* Amenity Filter Button */}
            <button
              onClick={() => setShowAmenityFilterModal(true)}
              className="flex items-center justify-between px-4 py-2 border border-gray-200 rounded-xl hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left cursor-pointer min-w-[200px]"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className={selectedAmenity === 'all' ? 'text-gray-500' : 'text-gray-900 font-medium'}>
                  {getCurrentAmenityLabel()}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {/* Date Filter Button */}
            <button
              onClick={() => setShowDateFilterModal(true)}
              className="flex items-center justify-between px-4 py-2 border border-gray-200 rounded-xl hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left cursor-pointer min-w-[180px]"
            >
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                <span className={!dateFilterOption || dateFilterOption.value === 'all' ? 'text-gray-500' : 'text-gray-900 font-medium'}>
                  {getCurrentDateLabel()}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Current View Indicator */}
        {(selectedAmenity !== 'all' || (dateFilterOption && dateFilterOption.value !== 'all')) && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-blue-900">Viendo:</span>
              <div className="flex items-center gap-4">
                {selectedAmenity !== 'all' && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg font-medium">
                    {selectedAmenity}
                  </span>
                )}
                {dateFilterOption && dateFilterOption.value !== 'all' && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-lg font-medium">
                    {getCurrentDateLabel()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 font-medium">
                  {selectedAmenity === 'all' ? 'Total Reservas' : `Reservas - ${selectedAmenity}`}
                </p>
                <p className="text-3xl font-bold text-blue-900">
                  {amenityStats.reduce((sum, a) => sum + a.totalReservations, 0)}
                </p>
                {selectedAmenity !== 'all' && (
                  <p className="text-sm text-blue-600 mt-1">
                    {((amenityStats.reduce((sum, a) => sum + a.totalReservations, 0) / Math.max(allReservations.length, 1)) * 100).toFixed(1)}% del total
                  </p>
                )}
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-medium">Amenities Activos</p>
                <p className="text-3xl font-bold text-green-900">{amenityStats.length}</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 font-medium">Utilización Promedio</p>
                <p className="text-3xl font-bold text-purple-900">
                  {amenityStats.length > 0
                    ? Math.round(amenityStats.reduce((sum, a) => sum + a.utilizationRate, 0) / amenityStats.length)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 font-medium">Hora Pico</p>
                <p className="text-3xl font-bold text-orange-900">{getPeakHour()}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </motion.div>
        </div>

        {/* Hourly Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Distribución por Hora
          </h3>
          <div className="h-64 flex items-end justify-between gap-1">
            {hourlyData.map((data, index) => {
              const maxCount = Math.max(...hourlyData.map(d => d.count), 1);
              const height = (data.count / maxCount) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: index * 0.02, duration: 0.5 }}
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg hover:from-blue-600 hover:to-blue-500 transition-colors cursor-pointer"
                      style={{ minHeight: data.count > 0 ? '4px' : '0' }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-2 rotate-0 group-hover:text-gray-700">
                    {index % 2 === 0 ? data.hour.split(':')[0] : ''}
                  </span>
                  {data.count > 0 && (
                    <span className="text-xs text-gray-600 font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {data.count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Amenity Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-bold text-gray-900">Estadísticas por Amenity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {amenityStats.map((amenity, index) => (
              <motion.div
                key={amenity.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-lg text-gray-900">{amenity.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {amenity.totalReservations} reserva{amenity.totalReservations !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {amenity.utilizationRate}%
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Horarios Pico:</p>
                    <div className="flex gap-2 flex-wrap">
                      {amenity.peakHours.slice(0, 3).map((peak, idx) => (
                        <span
                          key={peak.hour}
                          className={`px-2 py-1 rounded-lg text-xs font-medium ${idx === 0 ? 'bg-red-100 text-red-700' :
                            idx === 1 ? 'bg-orange-100 text-orange-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}
                        >
                          {peak.label} ({peak.count})
                        </span>
                      ))}
                      {amenity.peakHours.length === 0 && (
                        <span className="text-gray-500 text-xs">Sin datos suficientes</span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-600">Duración promedio:</span>
                    <span className="font-medium text-gray-900">{amenity.averageDuration}h</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {amenityStats.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay datos suficientes para mostrar estadísticas</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Filter Modals */}
      <AmenityFilterModal
        isVisible={showAmenityFilterModal}
        onClose={() => setShowAmenityFilterModal(false)}
        selectedAmenity={selectedAmenity}
        onAmenitySelect={setSelectedAmenity}
        availableAmenities={availableAmenities}
      />

      <DateFilterModal
        isVisible={showDateFilterModal}
        onClose={() => setShowDateFilterModal(false)}
        onDateFilterSelect={setDateFilterOption}
        selectedValue={dateFilterOption?.value || 'all'}
        title="Filtrar por Fecha"
        subtitle="Selecciona el rango de fechas para filtrar los análisis"
      />
    </>
  );
};

export default ReservationsAnalytics;
