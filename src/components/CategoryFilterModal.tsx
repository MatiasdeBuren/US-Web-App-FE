import { X, AlertTriangle, Wrench, Droplets, Zap, Wind, Users, Building } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface CategoryFilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const categoryOptions = [
  { value: 'all', label: 'Todas las Categorías', icon: AlertTriangle, color: 'gray' },
  { value: 'elevator', label: 'Ascensor', icon: Wrench, color: 'purple' },
  { value: 'plumbing', label: 'Plomería', icon: Droplets, color: 'blue' },
  { value: 'electrical', label: 'Eléctrico', icon: Zap, color: 'yellow' },
  { value: 'hvac', label: 'Aire Acondicionado', icon: Wind, color: 'green' },
  { value: 'common_areas', label: 'Áreas Comunes', icon: Users, color: 'indigo' },
  { value: 'building', label: 'Edificio', icon: Building, color: 'gray' },
  { value: 'other', label: 'Otros', icon: AlertTriangle, color: 'orange' }
];

function CategoryFilterModal({ isVisible, onClose, selectedCategory, onCategorySelect }: CategoryFilterModalProps) {
  if (!isVisible) return null;

  const handleCategoryClick = (categoryValue: string) => {
    onCategorySelect(categoryValue);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Filtrar por Categoría
                </h2>
                <p className="text-sm text-gray-500">
                  Selecciona una categoría para filtrar los reclamos
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

          {/* Categories Grid */}
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categoryOptions.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.value;
                
                return (
                  <button
                    key={category.value}
                    onClick={() => handleCategoryClick(category.value)}
                    className={`p-4 rounded-xl border-2 transition-all hover:shadow-md cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-8 h-8 mx-auto mb-3 ${
                      isSelected ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <span className={`text-sm font-medium block ${
                      isSelected ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {category.label}
                    </span>
                  </button>
                );
              })}
            </div>
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

export default CategoryFilterModal;