import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp
} from 'lucide-react';

interface MonthlyClaimData {
  month?: string;
  monthLabel?: string;
  label?: string;
  weekStart?: string;
  weekEnd?: string;
  nuevo: number;
  en_progreso: number;
  resuelto: number;
  cerrado: number;
  total: number;
}

interface ClaimsAnalyticsProps {
  token: string;
}

const ClaimsAnalytics: React.FC<ClaimsAnalyticsProps> = ({ token }) => {
  const [claimsPeriod, setClaimsPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [dayOffset, setDayOffset] = useState(0);
  const [monthlyClaimsData, setMonthlyClaimsData] = useState<MonthlyClaimData[]>([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState(false);

  const loadClaimsData = React.useCallback(async () => {
    setIsLoadingClaims(true);
    
    try {
      console.log('[CLAIMS] Fetching stats - Period:', claimsPeriod, 'Offset:', dayOffset);
      const claimsStats = await fetch(`${import.meta.env.VITE_API_URL}/admin/claims/stats?period=${claimsPeriod}&offset=${dayOffset}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }).then(res => res.json()).catch((err) => {
        console.error('[CLAIMS] Fetch error:', err);
        return { data: [] };
      });

      console.log('[CLAIMS STATS] Response:', {
        period: claimsStats.period,
        offset: claimsStats.offset,
        totalClaims: claimsStats.totalClaims,
        dataLength: claimsStats.data?.length || 0,
      });

      if (claimsStats && Array.isArray(claimsStats.data)) {
        setMonthlyClaimsData(claimsStats.data);
      } else {
        console.warn('[CLAIMS] Invalid response format or empty data');
        setMonthlyClaimsData([]);
      }
    } catch (error) {
      console.error('[CLAIMS] Error loading data:', error);
    } finally {
      setIsLoadingClaims(false);
    }
  }, [token, claimsPeriod, dayOffset]);

  useEffect(() => {
    loadClaimsData();
  }, [loadClaimsData]);

  useEffect(() => {
    setDayOffset(0);
  }, [claimsPeriod]);

  return (
    <>
      {/* Period selector */}
      <div className="flex gap-1 p-1 bg-indigo-50 rounded-lg mb-6">
          <button
            onClick={() => {
              setClaimsPeriod('daily');
              setDayOffset(0);
            }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              claimsPeriod === 'daily'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-700 hover:text-indigo-900'
            }`}
          >
            Diario
          </button>
          <button
            onClick={() => {
              setClaimsPeriod('weekly');
              setDayOffset(0);
            }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              claimsPeriod === 'weekly'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-700 hover:text-indigo-900'
            }`}
          >
            Semanal
          </button>
          <button
            onClick={() => {
              setClaimsPeriod('monthly');
              setDayOffset(0);
            }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              claimsPeriod === 'monthly'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-700 hover:text-indigo-900'
            }`}
          >
            Mensual
          </button>
        </div>

      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Evolución de Reclamos
              {dayOffset > 0 && (
                <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {claimsPeriod === 'weekly' ? `${dayOffset} semanas atrás` : 
                   claimsPeriod === 'monthly' ? `${dayOffset} meses atrás` : 
                   `${dayOffset} días atrás`}
                </span>
              )}
            </h3>

            <div className="flex gap-2">
              <button
                onClick={() => setDayOffset(prev => prev + (claimsPeriod === 'daily' ? 1 : claimsPeriod === 'weekly' ? 7 : 30))}
                disabled={isLoadingClaims}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>←</span>
                <span>Anterior</span>
              </button>
              <button
                onClick={() => setDayOffset(prev => Math.max(0, prev - (claimsPeriod === 'daily' ? 1 : claimsPeriod === 'weekly' ? 7 : 30)))}
                disabled={dayOffset === 0 || isLoadingClaims}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span>Siguiente</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {monthlyClaimsData.length > 0 ? (
            <div className="space-y-6">
              {isLoadingClaims && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-2xl">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <p className="text-sm text-gray-600">Cargando datos...</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-700">Nuevo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-gray-700">En Progreso</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-700">Resuelto</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span className="text-sm text-gray-700">Cerrado</span>
                </div>
              </div>

              <div className="relative h-96 mt-6">
                {(() => {
                  const maxValue = Math.max(...monthlyClaimsData.map(d => d.total), 1);
                  const step = maxValue <= 4 ? 1 : Math.ceil(maxValue / 4);
                  const maxYValue = Math.max(Math.ceil(maxValue / step) * step, 1);
                  const numTicks = Math.ceil(maxYValue / step) + 1;

                  return (
                    <div className="relative h-full">
                      {/* Eje Y */}
                      <div className="absolute left-0 top-0 bottom-12 w-12 flex flex-col justify-between text-xs text-gray-500 pr-2">
                        {Array.from({ length: numTicks }, (_, i) => {
                          const value = (numTicks - 1 - i) * step;
                          return (
                            <div key={i} className="flex items-center justify-end">
                              <span>{value}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Área de barras */}
                      <div className="absolute left-12 top-0 right-0 bottom-20 flex items-end justify-around border-l border-b border-gray-200 px-6 pb-2">
                        {monthlyClaimsData.map((data, index) => {
                          const barHeightPercent = (data.total / maxYValue) * 100;

                          return (
                            <div
                              key={`${data.month}-${index}`}
                              className="flex flex-col items-center justify-end w-16"
                              style={{ height: '100%' }}
                            >
                              {/* Total arriba */}
                              {data.total > 0 && (
                                <div className="text-sm font-semibold text-gray-900 mb-1">
                                  {data.total}
                                </div>
                              )}

                              {/* Barra apilada */}
                              {data.total > 0 ? (
                                <div
                                  className="w-full flex flex-col-reverse rounded-md overflow-hidden shadow-sm"
                                  style={{
                                    height: `${barHeightPercent}%`,
                                    backgroundColor: '#f3f4f6',
                                  }}
                                >
                                  {data.nuevo > 0 && (
                                    <div
                                      className="bg-blue-500 text-white text-xs font-medium flex items-center justify-center"
                                      style={{ flex: data.nuevo }}
                                    >
                                      {data.nuevo}
                                    </div>
                                  )}
                                  {data.en_progreso > 0 && (
                                    <div
                                      className="bg-yellow-500 text-white text-xs font-medium flex items-center justify-center"
                                      style={{ flex: data.en_progreso }}
                                    >
                                      {data.en_progreso}
                                    </div>
                                  )}
                                  {data.resuelto > 0 && (
                                    <div
                                      className="bg-green-500 text-white text-xs font-medium flex items-center justify-center"
                                      style={{ flex: data.resuelto }}
                                    >
                                      {data.resuelto}
                                    </div>
                                  )}
                                  {data.cerrado > 0 && (
                                    <div
                                      className="bg-gray-500 text-white text-xs font-medium flex items-center justify-center"
                                      style={{ flex: data.cerrado }}
                                    >
                                      {data.cerrado}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="h-full flex items-end justify-center text-gray-400 text-sm">
                                  —
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Etiquetas del eje X debajo del gráfico */}
                      <div className="absolute left-12 right-0 bottom-4 flex justify-around text-xs text-gray-700">
                        {monthlyClaimsData.map((data, index) => {
                          let labelText = '';
                          
                          if (claimsPeriod === 'weekly') {
                            if (data.weekStart && data.weekEnd) {
                              const start = new Date(data.weekStart);
                              const end = new Date(data.weekEnd);
                              const startDay = start.getDate();
                              const endDay = end.getDate();
                              const startMonth = start.toLocaleDateString('es-ES', { month: 'short' });
                              const endMonth = end.toLocaleDateString('es-ES', { month: 'short' });
                              
                              if (startMonth === endMonth) {
                                labelText = `${startDay}-${endDay}\n${startMonth}`;
                              } else {
                                labelText = `${startDay} ${startMonth}\n${endDay} ${endMonth}`;
                              }
                            } else {
                              labelText = data.label || `Semana ${index + 1}`;
                            }
                          } else if (claimsPeriod === 'monthly') {
                            labelText = data.monthLabel || data.label || data.month || `Mes ${index + 1}`;
                          } else {
                            labelText = data.label || `Día ${index + 1}`;
                          }
                          
                          return (
                            <div key={`${data.monthLabel || data.label || index}`} className="w-16 text-center whitespace-pre-line leading-tight">
                              {labelText}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {monthlyClaimsData.reduce((sum, d) => sum + d.nuevo, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Nuevos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {monthlyClaimsData.reduce((sum, d) => sum + d.en_progreso, 0)}
                  </div>
                  <div className="text-sm text-gray-600">En Progreso</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {monthlyClaimsData.reduce((sum, d) => sum + d.resuelto, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Resueltos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {monthlyClaimsData.reduce((sum, d) => sum + d.cerrado, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Cerrados</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay datos de reclamos para mostrar</p>
            </div>
          )}
        </motion.div>
    </>
  );
};

export default ClaimsAnalytics;
