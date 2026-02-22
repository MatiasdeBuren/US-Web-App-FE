import { useState } from 'react';
import { X, Building2, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AdminApartment } from '../api_calls/admin';

interface ExpenseApartmentFilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  apartments: AdminApartment[];
  selectedApartmentId: number | null;
  onApartmentSelect: (id: number | null) => void;
}

function ExpenseApartmentFilterModal({
  isVisible,
  onClose,
  apartments,
  selectedApartmentId,
  onApartmentSelect,
}: ExpenseApartmentFilterModalProps) {
  const [search, setSearch] = useState('');

  if (!isVisible) return null;

  const filtered = apartments.filter((apt) => {
    const q = search.toLowerCase();
    return (
      !q ||
      apt.unit.toLowerCase().includes(q) ||
      String(apt.floor).includes(q)
    );
  });

  const handleSelect = (id: number | null) => {
    onApartmentSelect(id);
    onClose();
    setSearch('');
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
        onClick={() => { onClose(); setSearch(''); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Filtrar por Departamento</h2>
                <p className="text-sm text-gray-500">Selecciona un departamento</p>
              </div>
            </div>
            <button
              onClick={() => { onClose(); setSearch(''); }}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Search */}
          <div className="px-6 pt-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por unidad o piso…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-1" style={{ scrollbarWidth: 'none' }}>
            {/* All option */}
            <button
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all cursor-pointer text-left ${
                selectedApartmentId === null
                  ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                  : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedApartmentId === null ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                  <Building2 className={`w-4 h-4 ${selectedApartmentId === null ? 'text-indigo-600' : 'text-gray-400'}`} />
                </div>
                <span className={`text-sm font-medium ${selectedApartmentId === null ? 'text-indigo-900' : 'text-gray-700'}`}>
                  Todos los deptos.
                </span>
              </div>
              {selectedApartmentId === null && (
                <div className="w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
              )}
            </button>

            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Sin resultados</p>
            ) : (
              filtered.map((apt) => {
                const isSelected = selectedApartmentId === apt.id;
                return (
                  <button
                    key={apt.id}
                    onClick={() => handleSelect(apt.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                        : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                        <Building2 className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-800'}`}>
                          Depto. {apt.unit}
                        </p>
                        <p className={`text-xs ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`}>
                          Piso {apt.floor}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => { onClose(); setSearch(''); }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ExpenseApartmentFilterModal;
