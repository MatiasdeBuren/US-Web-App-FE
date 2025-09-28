import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, AlertTriangle, Wrench, Droplets, Zap, Wind, Users, Building, Edit, Trash2, User, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import CreateClaimModal from '../components/CreateClaimModal';
import DeleteClaimModal from '../components/DeleteClaimModal';
import ClaimSuccessToast from '../components/ClaimSuccessToast';
import ClaimErrorToast from '../components/ClaimErrorToast';
import CategoryFilterModal from '../components/CategoryFilterModal';
import StatusFilterModal from '../components/StatusFilterModal';
import OwnershipFilterModal from '../components/OwnershipFilterModal';
import { 
  getClaims,
  createClaim, 
  updateClaim, 
  deleteClaim,
  type Claim,
  type UpdateClaimData
} from '../api_calls/claims';


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



function ClaimsPage() {
  // API and loading states
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOwnership, setSelectedOwnership] = useState<'all' | 'mine' | 'others'>('all');
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal and toast states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [claimToDelete, setClaimToDelete] = useState<Claim | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filter modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showOwnershipModal, setShowOwnershipModal] = useState(false);
  
  // Toast states
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [toastAction, setToastAction] = useState<'created' | 'updated' | 'deleted'>('created');
  const [toastClaimSubject, setToastClaimSubject] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Load claims function - stable function that always gets all data and lets React handle filtering
  const loadClaimsData = useCallback(async (authToken: string, includeAll: boolean = false) => {
    try {
      const response = await getClaims(authToken, {
        search: searchTerm,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        includeAll
      });
      
      return response.claims;
    } catch (error) {
      console.error('Error loading claims:', error);
      const errorMsg = error instanceof Error ? error.message : 'Error al cargar reclamos';
      setErrorMessage(errorMsg);
      setShowErrorToast(true);
      
      setTimeout(() => {
        setShowErrorToast(false);
        setErrorMessage('');
      }, 5000);
      return [];
    }
  }, [searchTerm, selectedCategory, selectedStatus]);

  // Effect to load and filter claims
  useEffect(() => {
    const loadAndFilterClaims = async () => {
      if (!token) return;
      
      setIsInitialLoading(true);
      
      try {
        // Determine if we need all claims based on ownership filter
        const needAllClaims = selectedOwnership === 'all' || selectedOwnership === 'others';
        
        // Load claims from API (API handles ownership filtering)
        const allClaims = await loadClaimsData(token, needAllClaims);
        
        // Apply client-side filtering for "others" ownership
        let filteredClaims = allClaims;
        if (selectedOwnership === 'others' && currentUser) {
          // When showing "others", filter out current user's claims
          filteredClaims = allClaims.filter(claim => claim.userId !== currentUser.id);
        }
        
        setClaims(filteredClaims);
      } catch (error) {
        console.error('Error loading claims:', error);
        setClaims([]);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadAndFilterClaims();
  }, [token, searchTerm, selectedCategory, selectedStatus, selectedOwnership, currentUser, loadClaimsData]);

  // Load user data function
  const loadUserData = useCallback(async (authToken: string) => {
    try {
      const userResponse = await fetch(`${import.meta.env.VITE_API_URL}/dashboard`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUser(userData.user);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  // Load token and user data on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (!savedToken) {
      setToken(null);
      setIsInitialLoading(false);
      return;
    }
    setToken(savedToken);
    loadUserData(savedToken);
  }, [loadUserData]);

  // Clear error states on component unmount
  useEffect(() => {
    return () => {
      setShowErrorToast(false);
      setShowSuccessToast(false);
      setErrorMessage('');
    };
  }, []);

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || claim.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || claim.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  const getCurrentCategoryLabel = () => {
    if (selectedCategory === 'all') return 'Todas las categorías';
    return categoryLabels[selectedCategory as keyof typeof categoryLabels];
  };

  const getCurrentStatusLabel = () => {
    if (selectedStatus === 'all') return 'Todos los estados';
    const labels = {
      pending: 'Pendiente',
      in_progress: 'En Progreso',
      resolved: 'Resuelto',
      rejected: 'Rechazado'
    };
    return labels[selectedStatus as keyof typeof labels];
  };

  const getCurrentOwnershipLabel = () => {
    const labels = {
      all: 'Todos los reclamos',
      mine: 'Mis reclamos',
      others: 'Reclamos de otros'
    };
    return labels[selectedOwnership];
  };

  const handleSaveClaim = async (claimData: any) => {
    if (!token) {
      setErrorMessage('No hay sesión activa');
      setShowErrorToast(true);
      return;
    }

    setIsSaving(true);
    try {
      if (editingClaim) {
        // Update existing claim
        const updatedClaim = await updateClaim(token, editingClaim.id, claimData as UpdateClaimData);
        setClaims(prev => prev.map(claim => 
          claim.id === editingClaim.id ? updatedClaim : claim
        ));
        setToastAction('updated');
        setToastClaimSubject(claimData.subject);
      } else {
        // Create new claim
        const newClaim = await createClaim(token, claimData);
        setClaims(prev => [newClaim, ...prev]);
        setToastAction('created');
        setToastClaimSubject(claimData.subject);
      }
      
      setShowCreateModal(false);
      setEditingClaim(null);
      setShowSuccessToast(true);
    } catch (error) {
      console.error('Error saving claim:', error);
      const errorMsg = error instanceof Error ? error.message : (editingClaim ? 'No se pudo actualizar el reclamo' : 'No se pudo crear el reclamo');
      setErrorMessage(errorMsg);
      setShowErrorToast(true);
      
      // Auto-clear error after 5 seconds to prevent navigation issues
      setTimeout(() => {
        setShowErrorToast(false);
        setErrorMessage('');
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClaim = (claim: Claim) => {
    setEditingClaim(claim);
    setShowCreateModal(true);
  };

  const handleDeleteClaim = (claim: Claim) => {
    setClaimToDelete(claim);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!claimToDelete || !token) {
      setErrorMessage('No hay sesión activa');
      setShowErrorToast(true);
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteClaim(token, claimToDelete.id);
      setClaims(prev => prev.filter(claim => claim.id !== claimToDelete.id));
      setShowDeleteModal(false);
      setClaimToDelete(null);
      setToastAction('deleted');
      setToastClaimSubject(claimToDelete.subject);
      setShowSuccessToast(true);
    } catch (error) {
      console.error('Error deleting claim:', error);
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo eliminar el reclamo');
      setShowErrorToast(true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Reclamos</h1>
            <p className="text-gray-600">Gestiona tus reclamos y reportes de mantenimiento</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg transition-all duration-200 hover:shadow-xl cursor-pointer w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Reclamo</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar reclamos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter Button */}
            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center justify-between w-full px-4 py-3 border border-gray-200 rounded-xl hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <span className={selectedCategory === 'all' ? 'text-gray-500' : 'text-gray-900 font-medium'}>
                  {getCurrentCategoryLabel()}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {/* Status Filter Button */}
            <button
              onClick={() => setShowStatusModal(true)}
              className="flex items-center justify-between w-full px-4 py-3 border border-gray-200 rounded-xl hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <span className={selectedStatus === 'all' ? 'text-gray-500' : 'text-gray-900 font-medium'}>
                  {getCurrentStatusLabel()}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {/* Ownership Filter Button */}
            <button
              onClick={() => setShowOwnershipModal(true)}
              className="flex items-center justify-between w-full px-4 py-3 border border-gray-200 rounded-xl hover:border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className={selectedOwnership === 'all' ? 'text-gray-500' : 'text-gray-900 font-medium'}>
                  {getCurrentOwnershipLabel()}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {isInitialLoading ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando reclamos...</p>
          </div>
        ) : token === null ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <AlertTriangle className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Sesión expirada</h3>
            <p className="text-gray-500 mb-6">
              Por favor, inicia sesión nuevamente para ver tus reclamos.
            </p>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay reclamos</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all' 
                ? 'No se encontraron reclamos con los filtros aplicados.'
                : 'Aún no has creado ningún reclamo.'
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Crear primer reclamo
            </button>
          </div>
        ) : (
          filteredClaims.map((claim) => {
            const CategoryIcon = categoryIcons[claim.category];
            
            return (
              <motion.div 
                key={claim.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="mb-4">
                  {/* Header with icon and title */}
                  <div className="flex items-center gap-3 mb-3">
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
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{claim.subject}</h3>
                      <p className="text-sm text-gray-500 truncate">{categoryLabels[claim.category]} • {claim.location}</p>
                    </div>
                  </div>
                  
                  {/* Badges - responsive layout */}
                  <div className="flex flex-wrap gap-2 sm:justify-start justify-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${priorityColors[claim.priority]}`}>
                      {priorityLabels[claim.priority]}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[claim.status]}`}>
                      {statusLabels[claim.status]}
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{claim.description}</p>

                <div className="pt-4 border-t border-gray-100 space-y-3">
                  {/* User info */}
                  <div className="text-sm text-gray-500 space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Creado por: <span className="font-medium text-gray-700">{claim.createdBy}</span></span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-4 gap-1">
                      <span>Creado: {formatDate(claim.createdAt)}</span>
                      {claim.updatedAt !== claim.createdAt && (
                        <span>Actualizado: {formatDate(claim.updatedAt)}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Action buttons - only show for user's own claims */}
                  {currentUser && claim.userId === currentUser.id && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                      <button 
                        onClick={() => handleEditClaim(claim)}
                        className="flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteClaim(claim)}
                        className="flex items-center justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <CreateClaimModal
        isVisible={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingClaim(null);
        }}
        onSave={handleSaveClaim}
        editingClaim={editingClaim}
        isSaving={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <DeleteClaimModal
        isVisible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setClaimToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        claimSubject={claimToDelete?.subject}
        isDeleting={isDeleting}
      />

      {/* Success Toast */}
      <ClaimSuccessToast
        isVisible={showSuccessToast}
        onComplete={() => {
          setShowSuccessToast(false);
          setToastClaimSubject('');
        }}
        action={toastAction}
        claimSubject={toastClaimSubject}
      />

      {/* Error Toast */}
      <ClaimErrorToast
        isVisible={showErrorToast}
        onComplete={() => {
          setShowErrorToast(false);
          setErrorMessage('');
        }}
        action={toastAction === 'created' ? 'create' : toastAction === 'updated' ? 'update' : 'delete'}
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
        isVisible={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        selectedStatus={selectedStatus}
        onStatusSelect={setSelectedStatus}
      />

      {/* Ownership Filter Modal */}
      <OwnershipFilterModal
        isVisible={showOwnershipModal}
        onClose={() => setShowOwnershipModal(false)}
        selectedOwnership={selectedOwnership}
        onOwnershipSelect={setSelectedOwnership}
      />
    </div>
  );
}

export default ClaimsPage;