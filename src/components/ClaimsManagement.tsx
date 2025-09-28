import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  AlertTriangle,
  Wrench,
  Droplets,
  Zap,
  Wind,
  Users,
  Building,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  PlayCircle,
  XCircle,
  User,
  Calendar,
  Filter,
  ChevronDown
} from 'lucide-react';
import {
  getAdminClaims,
  updateClaimStatus,
  deleteAdminClaim,
  type Claim
} from '../api_calls/claims';
import ClaimSuccessToast from './ClaimSuccessToast';
import ClaimErrorToast from './ClaimErrorToast';
import CategoryFilterModal from './CategoryFilterModal';
import StatusFilterModal from './StatusFilterModal';

interface ClaimsManagementProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

const categoryIcons = {
  ascensor: Wrench,
  plomeria: Droplets,
  electricidad: Zap,
  temperatura: Wind,
  areas_comunes: Users,
  edificio: Building,
  otro: AlertTriangle
};

const categoryLabels = {
  ascensor: 'Ascensor',
  plomeria: 'Plomería',
  electricidad: 'Eléctrico',
  temperatura: 'Calefacción/Aire',
  areas_comunes: 'Áreas Comunes',
  edificio: 'Edificio',
  otro: 'Otros'
};

const priorityColors = {
  baja: 'bg-blue-100 text-blue-800 border-blue-200',
  media: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  alta: 'bg-orange-100 text-orange-800 border-orange-200',
  urgente: 'bg-red-100 text-red-800 border-red-200'
};

const priorityLabels = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente'
};

const statusColors = {
  pendiente: 'bg-gray-100 text-gray-800 border-gray-200',
  en_progreso: 'bg-blue-100 text-blue-800 border-blue-200',
  resuelto: 'bg-green-100 text-green-800 border-green-200',
  rechazado: 'bg-red-100 text-red-800 border-red-200'
};

const statusLabels = {
  pendiente: 'Pendiente',
  en_progreso: 'En Progreso',
  resuelto: 'Resuelto',
  rechazado: 'Rechazado'
};

const statusIcons = {
  pendiente: Clock,
  en_progreso: PlayCircle,
  resuelto: CheckCircle,
  rechazado: XCircle
};

function ClaimsManagement({ isOpen, onClose, token }: ClaimsManagementProps) {
  // Main data state
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalClaims, setTotalClaims] = useState(0);
  
  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [claimToDelete, setClaimToDelete] = useState<Claim | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStatusFilterModal, setShowStatusFilterModal] = useState(false);
  const [claimToUpdateStatus, setClaimToUpdateStatus] = useState<Claim | null>(null);
  
  // Loading states
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Toast states
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [toastAction, setToastAction] = useState<'created' | 'updated' | 'deleted'>('created');
  const [toastSubject, setToastSubject] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Utility functions
  const getCurrentCategoryLabel = () => {
    if (selectedCategory === 'all') return 'Todas las categorías';
    return categoryLabels[selectedCategory as keyof typeof categoryLabels];
  };

  const getCurrentStatusLabel = () => {
    if (selectedStatus === 'all') return 'Todos los estados';
    return statusLabels[selectedStatus as keyof typeof statusLabels];
  };

  // Load claims
  const loadClaims = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAdminClaims(token, {
        page: currentPage,
        limit: 10,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        search: searchTerm || undefined
      });
      
      setClaims(response.claims);
      setTotalClaims(response.total);
      setTotalPages(Math.ceil(response.total / 10));
    } catch (error) {
      console.error('Error loading claims:', error);
      setErrorMessage('Error al cargar los reclamos');
      setShowErrorToast(true);
    } finally {
      setLoading(false);
    }
  }, [token, currentPage, selectedCategory, selectedStatus, searchTerm]);

  // Load claims when modal opens or filters change
  useEffect(() => {
    if (isOpen) {
      loadClaims();
    }
  }, [isOpen, loadClaims]);

  // Handle status update
  const handleStatusUpdate = async (claim: Claim, newStatus: string, adminNotes?: string) => {
    try {
      setIsUpdatingStatus(true);
      await updateClaimStatus(token, claim.id, newStatus as any, adminNotes);
      await loadClaims();
      setToastAction('updated');
      setToastSubject(claim.subject);
      setShowSuccessToast(true);
      setShowStatusModal(false);
      setClaimToUpdateStatus(null);
    } catch (error: any) {
      setErrorMessage(error.message || 'Error al actualizar el estado');
      setShowErrorToast(true);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!claimToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteAdminClaim(token, claimToDelete.id);
      await loadClaims();
      setToastAction('deleted');
      setToastSubject(claimToDelete.subject);
      setShowSuccessToast(true);
      setShowDeleteModal(false);
      setClaimToDelete(null);
    } catch (error: any) {
      setErrorMessage(error.message || 'Error al eliminar el reclamo');
      setShowErrorToast(true);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-[1400px] max-w-[95vw] h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Gestión de Reclamos
                </h2>
                <p className="text-sm text-gray-500">
                  {totalClaims} reclamos en total
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

          {/* Controls */}
          <div className="flex-shrink-0 p-6 border-b border-gray-100">
            <div className="flex gap-4 items-center">
              {/* Search */}
              <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar reclamos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2 ml-auto">
                {/* Category Filter Button */}
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="flex items-center justify-between px-4 py-2 border border-gray-200 rounded-xl hover:border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-left cursor-pointer min-w-[180px]"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className={selectedCategory === 'all' ? 'text-gray-500' : 'text-gray-900 font-medium'}>
                      {getCurrentCategoryLabel()}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Status Filter Button */}
                <button
                  onClick={() => setShowStatusFilterModal(true)}
                  className="flex items-center justify-between px-4 py-2 border border-gray-200 rounded-xl hover:border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors text-left cursor-pointer min-w-[160px]"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className={selectedStatus === 'all' ? 'text-gray-500' : 'text-gray-900 font-medium'}>
                      {getCurrentStatusLabel()}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </div>


            </div>
          </div>

          {/* Claims List */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : claims.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay reclamos
                </h3>
                <p className="text-gray-500">
                  No se encontraron reclamos con los filtros actuales.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {claims.map((claim) => {
                  const CategoryIcon = categoryIcons[claim.category];
                  const StatusIcon = statusIcons[claim.status];
                  
                  return (
                    <motion.div
                      key={claim.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* Category Icon */}
                        <div className={`p-2 rounded-xl ${
                          claim.category === 'ascensor' ? 'bg-purple-100 text-purple-600' :
                          claim.category === 'plomeria' ? 'bg-blue-100 text-blue-600' :
                          claim.category === 'electricidad' ? 'bg-yellow-100 text-yellow-600' :
                          claim.category === 'temperatura' ? 'bg-green-100 text-green-600' :
                          claim.category === 'areas_comunes' ? 'bg-indigo-100 text-indigo-600' :
                          claim.category === 'edificio' ? 'bg-gray-100 text-gray-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          <CategoryIcon className="w-5 h-5" />
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {claim.subject}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                {claim.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {claim.createdBy}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Building className="w-3 h-3" />
                                  {claim.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(claim.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setClaimToUpdateStatus(claim);
                                  setShowStatusModal(true);
                                }}
                                className="p-2 hover:bg-white rounded-lg transition-colors cursor-pointer"
                                title="Cambiar estado"
                              >
                                <Edit className="w-4 h-4 text-gray-500" />
                              </button>
                              <button
                                onClick={() => {
                                  setClaimToDelete(claim);
                                  setShowDeleteModal(true);
                                }}
                                className="p-2 hover:bg-white rounded-lg transition-colors cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </div>

                          {/* Tags */}
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${priorityColors[claim.priority]}`}>
                              {priorityLabels[claim.priority]}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[claim.status]} flex items-center gap-1`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusLabels[claim.status]}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 cursor-pointer"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Status Update Modal */}
        {showStatusModal && claimToUpdateStatus && (
          <StatusUpdateModal
            claim={claimToUpdateStatus}
            isVisible={showStatusModal}
            onClose={() => {
              setShowStatusModal(false);
              setClaimToUpdateStatus(null);
            }}
            onUpdate={handleStatusUpdate}
            isLoading={isUpdatingStatus}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && claimToDelete && (
          <DeleteConfirmationModal
            claim={claimToDelete}
            isVisible={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setClaimToDelete(null);
            }}
            onConfirm={handleDelete}
            isLoading={isDeleting}
          />
        )}
      </div>

      {/* Success Toast */}
      <ClaimSuccessToast
        isVisible={showSuccessToast}
        onComplete={() => setShowSuccessToast(false)}
        action={toastAction}
        claimSubject={toastSubject}
      />

      {/* Error Toast */}
      <ClaimErrorToast
        isVisible={showErrorToast}
        onComplete={() => setShowErrorToast(false)}
        errorMessage={errorMessage}
      />

      {/* Category Filter Modal */}
      <CategoryFilterModal
        isVisible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      {/* Status Filter Modal */}
      <StatusFilterModal
        isVisible={showStatusFilterModal}
        onClose={() => setShowStatusFilterModal(false)}
        selectedStatus={selectedStatus}
        onStatusSelect={setSelectedStatus}
      />
    </AnimatePresence>
  );
}

// Status Update Modal Component
interface StatusUpdateModalProps {
  claim: Claim;
  isVisible: boolean;
  onClose: () => void;
  onUpdate: (claim: Claim, status: string, adminNotes?: string) => void;
  isLoading: boolean;
}

function StatusUpdateModal({ claim, isVisible, onClose, onUpdate, isLoading }: StatusUpdateModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>(claim.status);
  const [adminNotes, setAdminNotes] = useState('');

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Actualizar Estado del Reclamo
        </h3>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Reclamo: <strong>{claim.subject}</strong></p>
          <p className="text-sm text-gray-500">Estado actual: {statusLabels[claim.status]}</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nuevo Estado
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
          >
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas Administrativas (Opcional)
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            placeholder="Añadir notas sobre el cambio de estado..."
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => onUpdate(claim, selectedStatus, adminNotes)}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Delete Confirmation Modal Component
interface DeleteConfirmationModalProps {
  claim: Claim;
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

function DeleteConfirmationModal({ claim, isVisible, onClose, onConfirm, isLoading }: DeleteConfirmationModalProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Eliminar Reclamo
          </h3>
        </div>
        
        <p className="text-gray-600 mb-2">
          ¿Estás seguro de que deseas eliminar este reclamo?
        </p>
        <p className="text-sm text-gray-500 mb-6">
          <strong>{claim.subject}</strong><br />
          Esta acción no se puede deshacer.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default ClaimsManagement;