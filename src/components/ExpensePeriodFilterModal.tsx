import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, CalendarDays, CalendarRange, Clock } from 'lucide-react';

export interface PeriodFilterOption {
  value: string;           
  label: string;           
  mode: 'all' | 'single' | 'range';
  period?: string;         
  periodFrom?: string;     
  periodTo?: string;       
}

interface ExpensePeriodFilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  onPeriodSelect: (option: PeriodFilterOption) => void;
  selectedValue: string;
  title?: string;
  subtitle?: string;
}

function toYYYYMM(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function buildPresetOptions(): PeriodFilterOption[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const currentPeriod = toYYYYMM(currentYear, currentMonth);

  const sub = (months: number) => {
    const d = new Date(currentYear, currentMonth - months, 1);
    return toYYYYMM(d.getFullYear(), d.getMonth());
  };

  return [
    {
      value: 'all',
      label: 'Todos los períodos',
      mode: 'all',
    },
    {
      value: 'current_month',
      label: 'Mes actual',
      mode: 'single',
      period: currentPeriod,
    },
    {
      value: 'last_3',
      label: 'Últimos 3 meses',
      mode: 'range',
      periodFrom: sub(2),
      periodTo: currentPeriod,
    },
    {
      value: 'last_6',
      label: 'Últimos 6 meses',
      mode: 'range',
      periodFrom: sub(5),
      periodTo: currentPeriod,
    },
    {
      value: 'last_year',
      label: 'Último año',
      mode: 'range',
      periodFrom: sub(11),
      periodTo: currentPeriod,
    },
    {
      value: 'custom',
      label: 'Período personalizado',
      mode: 'range',
    },
  ];
}

function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return d.toLocaleDateString('es-AR', { year: 'numeric', month: 'long' });
}

function getIcon(value: string) {
  switch (value) {
    case 'current_month': return Clock;
    case 'last_3':
    case 'last_6': return CalendarDays;
    case 'last_year': return Calendar;
    case 'custom': return CalendarRange;
    default: return Calendar;
  }
}

function getDescription(option: PeriodFilterOption): string {
  switch (option.value) {
    case 'all': return 'Ver expensas de todos los períodos';
    case 'current_month':
      return option.period ? formatPeriodLabel(option.period) : '';
    case 'last_3':
    case 'last_6':
    case 'last_year':
      return option.periodFrom && option.periodTo
        ? `${formatPeriodLabel(option.periodFrom)} → ${formatPeriodLabel(option.periodTo)}`
        : '';
    case 'custom': return 'Seleccionar un rango de inicio y fin personalizado';
    default: return '';
  }
}

const ExpensePeriodFilterModal = ({
  isVisible,
  onClose,
  onPeriodSelect,
  selectedValue,
  title = 'Filtrar por Período',
  subtitle = 'Selecciona un período para filtrar tus expensas',
}: ExpensePeriodFilterModalProps) => {
  const [showCustomInputs, setShowCustomInputs] = useState(false);
  const [fromYear, setFromYear] = useState<string>(String(new Date().getFullYear()));
  const [fromMonth, setFromMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [toYear, setToYear] = useState<string>(String(new Date().getFullYear()));
  const [toMonth, setToMonth] = useState<string>(String(new Date().getMonth() + 1).padStart(2, '0'));

  const presetOptions = buildPresetOptions();

  const handleOptionSelect = (option: PeriodFilterOption) => {
    if (option.value === 'custom') {
      setShowCustomInputs(true);
      return;
    }
    setShowCustomInputs(false);
    onPeriodSelect(option);
    onClose();
  };

  const handleCustomSubmit = () => {
    const periodFrom = `${fromYear}-${fromMonth.padStart(2, '0')}`;
    const periodTo = `${toYear}-${toMonth.padStart(2, '0')}`;
    // Ensure from <= to
    const [actualFrom, actualTo] = periodFrom <= periodTo
      ? [periodFrom, periodTo]
      : [periodTo, periodFrom];
    const label = `${formatPeriodLabel(actualFrom)} → ${formatPeriodLabel(actualTo)}`;
    const customOption: PeriodFilterOption = {
      value: 'custom',
      label,
      mode: 'range',
      periodFrom: actualFrom,
      periodTo: actualTo,
    };
    onPeriodSelect(customOption);
    onClose();
  };

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, '0'),
    label: new Date(2000, i, 1).toLocaleDateString('es-AR', { month: 'long' }),
  }));

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
                {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Custom inputs */}
          {showCustomInputs ? (
            <div className="space-y-5">
              <p className="text-sm text-gray-600 font-medium">Selecciona el rango de períodos:</p>

              {/* FROM */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Desde</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Mes</label>
                    <select
                      value={fromMonth}
                      onChange={(e) => setFromMonth(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white cursor-pointer"
                    >
                      {monthOptions.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label.charAt(0).toUpperCase() + m.label.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Año</label>
                    <select
                      value={fromYear}
                      onChange={(e) => setFromYear(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white cursor-pointer"
                    >
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* TO */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Hasta</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Mes</label>
                    <select
                      value={toMonth}
                      onChange={(e) => setToMonth(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white cursor-pointer"
                    >
                      {monthOptions.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label.charAt(0).toUpperCase() + m.label.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Año</label>
                    <select
                      value={toYear}
                      onChange={(e) => setToYear(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white cursor-pointer"
                    >
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-indigo-50 rounded-xl px-4 py-3 text-sm text-indigo-700 font-medium flex items-center gap-2">
                <CalendarRange className="w-4 h-4 flex-shrink-0" />
                <span className="capitalize">
                  {formatPeriodLabel(`${fromYear}-${fromMonth.padStart(2, '0')}`)}
                  {' → '}
                  {formatPeriodLabel(`${toYear}-${toMonth.padStart(2, '0')}`)}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCustomSubmit}
                  className="flex-1 bg-indigo-600 text-white py-2.5 px-4 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Aplicar rango
                </button>
                <button
                  onClick={() => setShowCustomInputs(false)}
                  className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            /* Preset options */
            <div
              className="space-y-2 overflow-y-auto"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {presetOptions.map((option) => {
                const IconComponent = getIcon(option.value);
                const isSelected = selectedValue === option.value;
                const description = getDescription(option);

                return (
                  <motion.button
                    key={option.value}
                    onClick={() => handleOptionSelect(option)}
                    className={`w-full text-left p-4 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-2 border-indigo-200'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-100' : 'bg-white'}`}>
                        <IconComponent
                          className={`w-5 h-5 ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold text-sm ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                          {option.label}
                        </h4>
                        {description && (
                          <p className={`text-xs mt-0.5 capitalize ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>
                            {description}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExpensePeriodFilterModal;
