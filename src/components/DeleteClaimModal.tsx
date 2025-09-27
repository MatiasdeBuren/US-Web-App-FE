import { X, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface DeleteClaimModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  claimSubject?: string;
  isDeleting?: boolean;
}

function DeleteClaimModal({ isVisible, onClose, onConfirm, claimSubject, isDeleting = false }: DeleteClaimModalProps) {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl max-w-md w-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Eliminar Reclamo
                </h2>
                <p className="text-sm text-gray-500">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              disabled={isDeleting}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                ¿Estás seguro de que deseas eliminar este reclamo?
              </p>
              {claimSubject && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Reclamo:</p>
                  <p className="font-medium text-gray-900">"{claimSubject}"</p>
                </div>
              )}
              <p className="text-sm text-red-600 mt-3">
                Una vez eliminado, no podrás recuperar este reclamo.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors cursor-pointer"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default DeleteClaimModal;