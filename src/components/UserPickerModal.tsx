import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserCircle2, Search, Users, Building2 } from 'lucide-react';
import type { AdminUser } from '../api_calls/admin';

interface UserPickerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (user: AdminUser) => void;
  selectedId: string;
  users: AdminUser[];
  loading?: boolean;
}

export default function UserPickerModal({
  isVisible,
  onClose,
  onSelect,
  selectedId,
  users,
  loading = false,
}: UserPickerModalProps) {
  const [search, setSearch] = useState('');

  const filtered = users
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((u) => {
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.apartment?.unit ?? '').toLowerCase().includes(q)
      );
    });

  const handleSelect = (user: AdminUser) => {
    onSelect(user);
    setSearch('');
    onClose();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
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
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Seleccionar Usuario</h3>
                <p className="text-xs text-gray-500 mt-0.5">{users.length} usuarios con departamento asignado</p>
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
                placeholder="Buscar por nombre, email o unidad…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ scrollbarWidth: 'none' }}>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
                <UserCircle2 className="w-8 h-8 opacity-40" />
                <p className="text-sm">Sin resultados</p>
              </div>
            ) : (
              filtered.map((u) => {
                const isSelected = selectedId === String(u.id);
                return (
                  <motion.button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelect(u)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-300 bg-indigo-50'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-indigo-100' : 'bg-white border border-gray-200'
                      }`}>
                        <UserCircle2 className={`w-5 h-5 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm truncate ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                          {u.name}
                        </p>
                        <p className={`text-xs mt-0.5 truncate ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>
                          {u.email}
                        </p>
                        {u.apartment && (
                          <p className={`text-xs mt-0.5 flex items-center gap-1 ${isSelected ? 'text-indigo-500' : 'text-gray-400'}`}>
                            <Building2 className="w-3 h-3 flex-shrink-0" />
                            Unidad {u.apartment.unit} · Piso {u.apartment.floor}
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
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
