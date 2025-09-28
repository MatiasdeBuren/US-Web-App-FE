import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';

interface ClaimSuccessToastProps {
  isVisible: boolean;
  onComplete: () => void;
  action?: 'created' | 'updated' | 'deleted';
  claimSubject?: string;
}

function ClaimSuccessToast({ 
  isVisible, 
  onComplete, 
  action = 'created',
  claimSubject 
}: ClaimSuccessToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  const getActionText = () => {
    switch (action) {
      case 'created': return 'creado';
      case 'updated': return 'actualizado';
      case 'deleted': return 'eliminado';
      default: return 'procesado';
    }
  };

  const getTitle = () => {
    switch (action) {
      case 'created': return 'Reclamo Creado';
      case 'updated': return 'Reclamo Actualizado';
      case 'deleted': return 'Reclamo Eliminado';
      default: return 'Reclamo Procesado';
    }
  };

  const isDeleteAction = action === 'deleted';
  const themeClasses = isDeleteAction 
    ? {
        border: 'border-red-200',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        titleColor: 'text-red-900',
        textColor: 'text-red-700',
        buttonHover: 'hover:bg-red-100',
        buttonIcon: 'text-red-600',
        progressBg: 'bg-red-100',
        progressBar: 'bg-red-500'
      }
    : {
        border: 'border-green-200',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        titleColor: 'text-green-900',
        textColor: 'text-green-700',
        buttonHover: 'hover:bg-green-100',
        buttonIcon: 'text-green-600',
        progressBg: 'bg-green-100',
        progressBar: 'bg-green-500'
      };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed top-4 right-4 z-50">
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className={`bg-white rounded-2xl shadow-xl border ${themeClasses.border} p-4 max-w-sm w-full`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 ${themeClasses.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
                <CheckCircle className={`w-4 h-4 ${themeClasses.iconColor}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold ${themeClasses.titleColor} mb-1`}>
                  {getTitle()}
                </h4>
                <p className={`text-sm ${themeClasses.textColor}`}>
                  {action === 'deleted' ? (
                    <>
                      Tu reclamo ha sido eliminado exitosamente
                      {claimSubject && (
                        <>
                          <br />
                          <span className="font-medium">"{claimSubject}"</span>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      Tu reclamo ha sido {getActionText()} exitosamente
                      {claimSubject && (
                        <>
                          <br />
                          <span className="font-medium">"{claimSubject}"</span>
                        </>
                      )}
                    </>
                  )}
                </p>
              </div>

              <button
                onClick={onComplete}
                className={`p-1 ${themeClasses.buttonHover} rounded-lg transition-colors flex-shrink-0 cursor-pointer`}
              >
                <X className={`w-4 h-4 ${themeClasses.buttonIcon}`} />
              </button>
            </div>

            {/* Progress bar */}
            <motion.div
              className={`mt-3 h-1 ${themeClasses.progressBg} rounded-full overflow-hidden`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className={`h-full ${themeClasses.progressBar} rounded-full`}
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
              />
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ClaimSuccessToast;