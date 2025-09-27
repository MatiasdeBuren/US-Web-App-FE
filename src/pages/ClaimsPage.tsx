import { useState } from 'react';
import { Plus, Search, Filter, AlertTriangle, Wrench, Droplets, Zap, Wind, Users, Building, Edit, Trash2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import CreateClaimModal from '../components/CreateClaimModal';
import DeleteClaimModal from '../components/DeleteClaimModal';
import ClaimSuccessToast from '../components/ClaimSuccessToast';
import ClaimErrorToast from '../components/ClaimErrorToast';
import CategoryFilterModal from '../components/CategoryFilterModal';
import StatusFilterModal from '../components/StatusFilterModal';

interface Claim {
  id: number;
  subject: string;
  category: 'elevator' | 'plumbing' | 'electrical' | 'hvac' | 'common_areas' | 'building' | 'other';
  description: string;
  location: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

const categoryIcons = {
  elevator: Wrench,
  plumbing: Droplets,
  electrical: Zap,
  hvac: Wind,
  common_areas: Users,
  building: Building,
  other: AlertTriangle
};

const categoryLabels = {
  elevator: 'Ascensor',
  plumbing: 'Plomería',
  electrical: 'Eléctrico',
  hvac: 'Aire Acondicionado',
  common_areas: 'Áreas Comunes',
  building: 'Edificio',
  other: 'Otros'
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-800 border-red-200'
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-800 border-gray-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200'
};

function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([
    {
      id: 1,
      subject: 'Ascensor principal fuera de servicio',
      category: 'elevator',
      description: 'El ascensor principal del edificio no funciona desde esta mañana. Los botones no responden.',
      location: 'Lobby principal - Ascensor A',
      priority: 'urgent',
      status: 'pending',
      createdAt: '2024-01-15T10:30:00',
      updatedAt: '2024-01-15T10:30:00',
      createdBy: 'María González'
    },
    {
      id: 2,
      subject: 'Filtración de agua en el gimnasio',
      category: 'plumbing',
      description: 'Se observa una filtración de agua en el techo del gimnasio, cerca del área de pesas.',
      location: 'Gimnasio - Área de pesas',
      priority: 'high',
      status: 'in_progress',
      createdAt: '2024-01-14T15:20:00',
      updatedAt: '2024-01-15T09:15:00',
      createdBy: 'Carlos Rodríguez'
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClaim, setEditingClaim] = useState<Claim | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);

  // Delete modal and toast states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [claimToDelete, setClaimToDelete] = useState<Claim | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filter modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  // Toast states
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [toastAction, setToastAction] = useState<'created' | 'updated' | 'deleted'>('created');
  const [toastClaimSubject, setToastClaimSubject] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

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

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente'
    };
    return labels[priority as keyof typeof labels];
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendiente',
      in_progress: 'En Progreso',
      resolved: 'Resuelto',
      rejected: 'Rechazado'
    };
    return labels[status as keyof typeof labels];
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

  const handleSaveClaim = async (claimData: any) => {
    setIsSaving(true);
    try {
      if (editingClaim) {
        // Update existing claim
        setClaims(prev => prev.map(claim => 
          claim.id === editingClaim.id 
            ? { ...claim, ...claimData, updatedAt: new Date().toISOString() }
            : claim
        ));
        setToastAction('updated');
        setToastClaimSubject(claimData.subject);
      } else {
        // Create new claim
        const newClaim: Claim = {
          id: Date.now(),
          ...claimData,
          status: 'pending' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'Usuario Actual' // This would come from the logged-in user context in a real app
        };
        setClaims(prev => [newClaim, ...prev]);
        setToastAction('created');
        setToastClaimSubject(claimData.subject);
      }
      
      setShowCreateModal(false);
      setEditingClaim(null);
      setShowSuccessToast(true);
    } catch (error) {
      console.error('Error saving claim:', error);
      setErrorMessage(editingClaim ? 'No se pudo actualizar el reclamo' : 'No se pudo crear el reclamo');
      setShowErrorToast(true);
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
    if (!claimToDelete) return;
    
    setIsDeleting(true);
    try {
      setClaims(prev => prev.filter(claim => claim.id !== claimToDelete.id));
      setShowDeleteModal(false);
      setClaimToDelete(null);
      setToastAction('deleted');
      setToastClaimSubject(claimToDelete.subject);
      setShowSuccessToast(true);
    } catch (error) {
      console.error('Error deleting claim:', error);
      setErrorMessage('No se pudo eliminar el reclamo');
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
              <Filter className="w-4 h-4 text-gray-400" />
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
              <Filter className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {filteredClaims.length === 0 ? (
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
                      claim.category === 'elevator' ? 'bg-purple-100 text-purple-600' :
                      claim.category === 'plumbing' ? 'bg-blue-100 text-blue-600' :
                      claim.category === 'electrical' ? 'bg-yellow-100 text-yellow-600' :
                      claim.category === 'hvac' ? 'bg-green-100 text-green-600' :
                      claim.category === 'common_areas' ? 'bg-indigo-100 text-indigo-600' :
                      claim.category === 'building' ? 'bg-gray-100 text-gray-600' :
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
                      {getPriorityLabel(claim.priority)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[claim.status]}`}>
                      {getStatusLabel(claim.status)}
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
                  
                  {/* Action buttons - responsive layout */}
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
    </div>
  );
}

export default ClaimsPage;