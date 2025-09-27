import { X, Clock, PlayCircle, CheckCircle, XCircle, Filter } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface StatusFilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedStatus: string;
  onStatusSelect: (status: string) => void;
}

const statusOptions = [
  { 
    value: 'all', 
    label: 'Todos los Estados', 
    icon: Filter, 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Ver todos los reclamos sin filtro'
  },
  { 
    value: 'pending', 
    label: 'Pendiente', 
    icon: Clock, 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    description: 'Reclamos que están esperando revisión'
  },
  { 
    value: 'in_progress', 
    label: 'En Progreso', 
    icon: PlayCircle, 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Reclamos que se están resolviendo actualmente'
  },
  { 
    value: 'resolved', 
    label: 'Resuelto', 
    icon: CheckCircle, 
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Reclamos que han sido completados'
  },
  { 
    value: 'rejected', 
    label: 'Rechazado', 
    icon: XCircle, 
    color: 'bg-red-100 text-red-800 border-red-200',
    description: 'Reclamos que no pudieron ser procesados'
  }
];

function StatusFilterModal({ isVisible, onClose, selectedStatus, onStatusSelect }: StatusFilterModalProps) {
  if (!isVisible) return null;

  const handleStatusClick = (statusValue: string) => {
    onStatusSelect(statusValue);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Filtrar por Estado
                </h2>
                <p className="text-sm text-gray-500">
                  Selecciona un estado para filtrar los reclamos
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Status Options */}
          <div className="p-6 space-y-3">
            {statusOptions.map((status) => {
              const Icon = status.icon;
              const isSelected = selectedStatus === status.value;
              
              return (
                <button
                  key={status.value}
                  onClick={() => handleStatusClick(status.value)}
                  className={`w-full p-4 rounded-xl border-2 transition-all hover:shadow-md text-left cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        isSelected ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`font-semibold ${
                          isSelected ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {status.label}
                        </span>
                        {status.value !== 'all' && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                            {status.label}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${
                        isSelected ? 'text-blue-700' : 'text-gray-500'
                      }`}>
                        {status.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default StatusFilterModal;