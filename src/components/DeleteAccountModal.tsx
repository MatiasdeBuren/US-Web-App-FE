import { motion, AnimatePresence } from "framer-motion";

interface DeleteAccountModalProps {
    isVisible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    userName: string;
    isDeleting?: boolean;
}

function DeleteAccountModal({ 
    isVisible, 
    onClose, 
    onConfirm,
    userName,
    isDeleting = false
}: DeleteAccountModalProps) {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/30"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 120, damping: 15 }}
                        className="bg-white rounded-3xl shadow-2xl p-8 w-96 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center mb-6">
                            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-gray-800">Eliminar cuenta</h3>
                            <p className="text-gray-600 mb-4">
                                ¿Estás seguro de que quieres eliminar tu cuenta permanentemente?
                            </p>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                <p className="text-sm text-red-700">
                                    <strong>Cuenta a eliminar:</strong> {userName}
                                </p>
                                <p className="text-xs text-red-600 mt-1">
                                    Esta acción no se puede deshacer y perderás todos tus datos.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={onClose}
                                disabled={isDeleting}
                                className={`px-6 py-2 rounded-lg transition-all ${
                                    isDeleting 
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                        : 'bg-gray-300 hover:bg-gray-400 cursor-pointer'
                                }`}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isDeleting}
                                className={`px-6 py-2 rounded-lg text-white transition-all ${
                                    isDeleting
                                        ? 'bg-red-400 cursor-not-allowed'
                                        : 'bg-red-600 hover:bg-red-700 cursor-pointer'
                                }`}
                            >
                                {isDeleting ? 'Eliminando...' : 'Eliminar cuenta'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default DeleteAccountModal;