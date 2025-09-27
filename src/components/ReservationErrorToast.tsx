import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X } from "lucide-react";
import { useEffect } from "react";

interface ReservationErrorToastProps {
    isVisible: boolean;
    onComplete: () => void;
    errorMessage?: string;
}

function ReservationErrorToast({ 
    isVisible, 
    onComplete, 
    errorMessage 
}: ReservationErrorToastProps) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onComplete();
            }, 6000); // Show for 6 seconds (longer for errors so users can read them)

            return () => clearTimeout(timer);
        }
    }, [isVisible, onComplete]);

    const handleClose = () => {
        onComplete();
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 0.95 }}
                    className="fixed top-4 right-4 z-[70] bg-white rounded-xl shadow-2xl border border-red-200 p-4 max-w-sm"
                >
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">Error al reservar</h4>
                            <p className="text-sm text-gray-600 mt-1">
                                {errorMessage || "No se pudo completar la reserva. Inténtalo de nuevo."}
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Cerrar notificación"
                        >
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                    
                    {/* Progress bar */}
                    <motion.div
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: 6, ease: "linear" }}
                        className="h-1 bg-red-500 rounded-full mt-3"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default ReservationErrorToast;