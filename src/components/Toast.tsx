import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({ id, message, type, duration = 4000, onClose }: ToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 10);
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const typeConfig = {
    success: {
      icon: CheckCircle,
      borderColor: 'border-green-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      textColor: 'text-green-800',
      progressColor: 'bg-green-500',
    },
    error: {
      icon: XCircle,
      borderColor: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      textColor: 'text-red-800',
      progressColor: 'bg-red-500',
    },
    warning: {
      icon: AlertTriangle,
      borderColor: 'border-yellow-200',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-800',
      progressColor: 'bg-yellow-500',
    },
    info: {
      icon: Info,
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-800',
      progressColor: 'bg-blue-500',
    },
  };

  const config = typeConfig[type];
  const IconComponent = config.icon;

  return (
    <AnimatePresence>
      {mounted && (
        <motion.div
          initial={{ x: 400, y: -100, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          exit={{ x: 400, y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className={`bg-white rounded-xl shadow-lg border-2 ${config.borderColor} min-w-[320px] max-w-[400px] overflow-hidden`}>
            {/* Progress bar */}
            <div className="h-1 bg-gray-200">
              <motion.div
                className={`h-full ${config.progressColor}`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
              />
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className={`${config.iconBg} p-2 rounded-lg flex-shrink-0`}>
                  <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
                </div>
                <p className={`flex-1 font-semibold text-sm ${config.textColor} pt-1`}>{message}</p>
                <button
                  onClick={() => onClose(id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ToastContextType {
  showToast: (message: string, type: ToastProps['type']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback((message: string, type: ToastProps['type']) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: ToastProps = {
      id,
      message,
      type,
      onClose: (toastId) => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      }
    };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Render toasts */}
      <div className="fixed top-4 right-4 z-[9999] pointer-events-none flex flex-col gap-3">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className="pointer-events-auto"
          >
            <Toast
              {...toast}
              onClose={removeToast}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}