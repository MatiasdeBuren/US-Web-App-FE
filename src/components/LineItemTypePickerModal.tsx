import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Layers, Tag } from 'lucide-react';
import type { ExpenseType } from '../api_calls/expenses';

interface LineItemTypePickerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (type: ExpenseType) => void;
  selectedId: number;
  types: ExpenseType[];
  usedTypeIds?: number[];
}

export default function LineItemTypePickerModal({
  isVisible,
  onClose,
  onSelect,
  selectedId,
  types,
  usedTypeIds = [],
}: LineItemTypePickerModalProps) {
  const [search, setSearch] = useState('');

  const filtered = types.filter((t) => {
    const q = search.toLowerCase();
    return t.label.toLowerCase().includes(q) || t.name.toLowerCase().includes(q);
  });

  const handleSelect = (type: ExpenseType) => {
    onSelect(type);
    setSearch('');
    onClose();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[75] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={() => { setSearch(''); onClose(); }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Layers className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Seleccionar Tipo</h3>
                <p className="text-xs text-gray-500 mt-0.5">{types.length} tipos disponibles</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setSearch(''); onClose(); }}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Search */}
          <div className="px-6 py-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar tipo de rubro…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ scrollbarWidth: 'none' }}>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
                <Layers className="w-8 h-8 opacity-40" />
                <p className="text-sm">Sin resultados</p>
              </div>
            ) : (
              filtered.map((type) => {
                const isSelected = selectedId === type.id;
                const subtypeCount = type.subtypes?.length ?? 0;
                const isBlocked = !isSelected && subtypeCount === 0 && usedTypeIds.includes(type.id);
                return (
                  <motion.button
                    key={type.id}
                    type="button"
                    onClick={() => !isBlocked && handleSelect(type)}
                    whileHover={!isBlocked ? { scale: 1.01 } : {}}
                    whileTap={!isBlocked ? { scale: 0.99 } : {}}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isBlocked
                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        : isSelected
                          ? 'border-indigo-300 bg-indigo-50 cursor-pointer'
                          : 'border-gray-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/50 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg flex-shrink-0 ${isSelected ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                          <Layers className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-800' : 'text-gray-800'}`}>
                            {type.label}
                          </p>
                          {subtypeCount > 0 ? (
                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {subtypeCount} {subtypeCount === 1 ? 'subrubro' : 'subrubros'}
                            </p>
                          ) : isBlocked ? (
                            <p className="text-xs text-amber-500 mt-0.5">Ya agregado</p>
                          ) : null}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 flex-shrink-0" />
                      )}
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
