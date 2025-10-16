import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  BarChart3, 
  Clock, 
  Calendar, 
  TrendingUp, 
  Activity,
  PieChart,
  RefreshCw,
  Filter,
  ChevronDown,
  CalendarDays
} from 'lucide-react';
import { getAdminReservations } from '../api_calls/admin';
import DateFilterModal, { type DateFilterOption } from './DateFilterModal';
import AmenityFilterModal from './AmenityFilterModal';

interface AnalyticsReportsProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

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

const AnalyticsReports: React.FC<AnalyticsReportsProps> = ({ isOpen, onClose, token }) => {
  const [loading, setLoading] = useState(true);
  const [amenityStats, setAmenityStats] = useState<AmenityStats[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [allReservations, setAllReservations] = useState<any[]>([]);
  
  // Filter states
  const [selectedAmenity, setSelectedAmenity] = useState<string>('all');
  const [dateFilterOption, setDateFilterOption] = useState<DateFilterOption | null>(null);
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);
  const [showAmenityFilterModal, setShowAmenityFilterModal] = useState(false);
  
  // Available amenities for filtering
  const [availableAmenities, setAvailableAmenities] = useState<Array<{id: number, name: string}>>([]);

  const processAndSetData = React.useCallback((reservations: any[]) => {
    // Apply filters to reservations
    let filteredReservations = [...reservations];
    
    // Apply amenity filter
    if (selectedAmenity !== 'all') {
      filteredReservations = filteredReservations.filter(r => 
        r.amenity?.name === selectedAmenity
      );
    }
    
    // Apply date filter
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
    
    console.log('📊 [ANALYTICS] Filtered to', filteredReservations.length, 'reservations');
    
    // Process data for analytics
    const processedStats = processReservationData(filteredReservations);
    const processedHourly = processHourlyData(filteredReservations);
    
    setAmenityStats(processedStats);
    setHourlyData(processedHourly);
  }, [selectedAmenity, dateFilterOption]);

  const loadAnalyticsData = React.useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 [ANALYTICS] Loading reservations data...');
      
      const reservations = await getAdminReservations(token, { limit: 1000 }); // Get more data for analysis
      
      console.log('📊 [ANALYTICS] Processing', reservations.length, 'reservations');

      // Store all reservations for filtering
      setAllReservations(reservations);
      
      // Extract available amenities
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

      // Process data for analytics with current filters
      processAndSetData(reservations);
    } catch (error) {
      console.error('❌ [ANALYTICS] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [token, processAndSetData]);

  useEffect(() => {
    if (isOpen) {
      loadAnalyticsData();
    }
  }, [isOpen, loadAnalyticsData]);

  // Reprocess data when filters change
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
      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // hours
      
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
    
    // Convert to final format
    const result: AmenityStats[] = Array.from(amenityMap.values()).map(stats => {
      // Find peak hours (top 3)
      const hourlyWithIndex = stats.hourlyCount.map((count: number, hour: number) => ({ hour, count }));
      const peakHours = hourlyWithIndex
        .sort((a: { hour: number; count: number }, b: { hour: number; count: number }) => b.count - a.count)
        .slice(0, 3)
        .filter((h: { hour: number; count: number }) => h.count > 0)
        .map((h: { hour: number; count: number }) => ({
          ...h,
          label: `${h.hour.toString().padStart(2, '0')}:00`
        }));
      
      const utilizationRate = stats.totalReservations > 0 ? Math.min((stats.totalReservations / 30) * 100, 100) : 0; // Rough calculation
      const averageDuration = stats.totalReservations > 0 ? stats.totalDuration / stats.totalReservations : 0;
      
      return {
        id: stats.id,
        name: stats.name,
        totalReservations: stats.totalReservations,
        peakHours,
        utilizationRate: Math.round(utilizationRate),
        averageDuration: Math.round(averageDuration * 10) / 10 // Round to 1 decimal
      };
    });
    
    return result.sort((a, b) => b.totalReservations - a.totalReservations);
  };

  const processHourlyData = (reservations: any[]): HourlyData[] => {
    const hourlyMap = new Map<number, any>();
    
    // Initialize all hours
    for (let hour = 0; hour < 24; hour++) {
      hourlyMap.set(hour, {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        count: 0,
        amenities: {}
      });
    }
    
    reservations.forEach(reservation => {
      const startTime = new Date(reservation.startTime);
      const hour = startTime.getHours();
      const amenityName = reservation.amenity?.name || 'Desconocido';
      
      const hourData = hourlyMap.get(hour);
      hourData.count++;
      hourData.amenities[amenityName] = (hourData.amenities[amenityName] || 0) + 1;
    });
    
    return Array.from(hourlyMap.values());
  };

  const getMaxCount = () => {
    return Math.max(...hourlyData.map(h => h.count), 1);
  };

  const getCurrentDateLabel = () => {
    if (!dateFilterOption || dateFilterOption.value === 'all') return 'Todas las fechas';
    
    switch (dateFilterOption.value) {
      case 'today': return 'Hoy';
      case 'last-7-days': return 'Últimos 7 días';
      case 'this-month': return 'Este mes';
      case 'last-30-days': return 'Últimos 30 días';
      case 'last-90-days': return 'Últimos 90 días';
      case 'this-year': return 'Este año';
      case 'custom': 
        if (dateFilterOption.startDate && dateFilterOption.endDate) {
          const start = new Date(dateFilterOption.startDate).toLocaleDateString('es-ES');
          const end = new Date(dateFilterOption.endDate).toLocaleDateString('es-ES');
          return `${start} - ${end}`;
        }
        return 'Rango personalizado';
      default: return 'Todas las fechas';
    }
  };

  const getCurrentAmenityLabel = () => {
    if (selectedAmenity === 'all') return 'Todas las amenities';
    return availableAmenities.find(a => a.name === selectedAmenity)?.name || selectedAmenity;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Análisis y Reportes</h2>
                <p className="text-gray-600">Métricas detalladas de amenities y reservas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={loadAnalyticsData}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filters Section */}
          <div className="flex-shrink-0 p-6 border-b border-gray-100">
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
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
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
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0 scrollbar-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando datos de análisis...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
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
                        <p className="text-3xl font-bold text-orange-900">
                          {hourlyData.length > 0 
                            ? hourlyData.reduce((max, curr) => curr.count > max.count ? curr : max, hourlyData[0])?.hour || '--'
                            : '--'}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-orange-600" />
                    </div>
                  </motion.div>
                </div>

                {/* Hourly Usage Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Horarios Más Concurridos
                    </h3>
                  </div>
                  
                  <div className="space-y-2">
                    {hourlyData.map((hour, index) => (
                      <div key={hour.hour} className="flex items-center gap-4">
                        <div className="w-16 text-sm font-medium text-gray-600">{hour.hour}</div>
                        <div className="flex-1 flex items-center">
                          <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(hour.count / getMaxCount()) * 100}%` }}
                              transition={{ delay: index * 0.05, duration: 0.8, ease: "easeOut" }}
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-end pr-2"
                            >
                              {hour.count > 0 && (
                                <span className="text-white text-xs font-medium">
                                  {hour.count}
                                </span>
                              )}
                            </motion.div>
                          </div>
                        </div>
                        <div className="w-16 text-sm text-gray-500 text-right">
                          {hour.count} reservas
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Amenity Statistics */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-green-600" />
                    Estadísticas por Amenity
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {amenityStats.map((amenity, index) => (
                      <motion.div
                        key={amenity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">{amenity.name}</h4>
                            <p className="text-gray-600 text-sm">{amenity.totalReservations} reservas totales</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              amenity.utilizationRate >= 80 ? 'bg-red-100 text-red-700' :
                              amenity.utilizationRate >= 60 ? 'bg-yellow-100 text-yellow-700' :
                              amenity.utilizationRate >= 40 ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {amenity.utilizationRate}% uso
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Horarios Pico:</p>
                            <div className="flex gap-2 flex-wrap">
                              {amenity.peakHours.slice(0, 3).map((peak, idx) => (
                                <span
                                  key={peak.hour}
                                  className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                    idx === 0 ? 'bg-red-100 text-red-700' :
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
            )}
          </div>
        </motion.div>

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
      </div>
    </AnimatePresence>
  );
};

export default AnalyticsReports;