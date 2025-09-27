import { motion, AnimatePresence } from "framer-motion";
import { EyeOff } from "lucide-react";
import { useEffect } from "react";

interface ReservationHiddenToastProps {
    isVisible: boolean;
    onComplete: () => void;
}

function ReservationHiddenToast({ isVisible, onComplete }: ReservationHiddenToastProps) {
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
                    className="fixed top-4 right-4 z-[70] bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-w-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <EyeOff className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">Reserva ocultada</h4>
                            <p className="text-sm text-gray-600">La reserva se eliminó de tu vista</p>
                        </div>
                    </div>
                    
                    {/* Progress bar */}
                    <motion.div
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: 3, ease: "linear" }}
                        className="h-1 bg-gray-500 rounded-full mt-3"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default ReservationHiddenToast;