import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { useEffect } from "react";

interface ReservationCancelledToastProps {
    isVisible: boolean;
    onComplete: () => void;
}

function ReservationCancelledToast({ isVisible, onComplete }: ReservationCancelledToastProps) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onComplete();
            }, 3000); // Show for 3 seconds

            return () => clearTimeout(timer);
        }
    }, [isVisible, onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -50, scale: 0.95 }}
                    className="fixed top-4 right-4 z-[70] bg-white rounded-xl shadow-2xl border border-orange-200 p-4 max-w-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">Reserva cancelada</h4>
                            <p className="text-sm text-gray-600">Tu reserva ha sido cancelada exitosamente</p>
                        </div>
                    </div>
                    
                    {/* Progress bar */}
                    <motion.div
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: 3, ease: "linear" }}
                        className="h-1 bg-orange-500 rounded-full mt-3"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default ReservationCancelledToast;