import { X, Users, User, Globe, Filter } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface OwnershipFilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedOwnership: 'all' | 'mine' | 'others';
  onOwnershipSelect: (ownership: 'all' | 'mine' | 'others') => void;
}

const ownershipOptions = [
  { 
    value: 'all' as const, 
    label: 'Todos los Reclamos', 
    icon: Globe, 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Ver todos los reclamos de la comunidad'
  },
  { 
    value: 'mine' as const, 
    label: 'Mis Reclamos', 
    icon: User, 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Solo los reclamos que he creado'
  },
  { 
    value: 'others' as const, 
    label: 'Reclamos de Otros', 
    icon: Users, 
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    description: 'Requiere permisos adicionales (próximamente)'
  }
];

function OwnershipFilterModal({ isVisible, onClose, selectedOwnership, onOwnershipSelect }: OwnershipFilterModalProps) {
  if (!isVisible) return null;

  const handleSelect = (ownership: 'all' | 'mine' | 'others') => {
    onOwnershipSelect(ownership);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-xl">
                <Filter className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Filtrar por Propiedad</h3>
                <p className="text-sm text-gray-500">Selecciona qué reclamos ver</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {ownershipOptions.map((option) => {
              const IconComponent = option.icon;
              const isSelected = selectedOwnership === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${option.color}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {option.label}
                    </span>
                    {isSelected && (
                      <div className="ml-auto w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <p className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default OwnershipFilterModal;