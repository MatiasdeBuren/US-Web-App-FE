import { AlertTriangle } from 'lucide-react';
import GenericConfirmModal from './GenericConfirmModal';

interface DeleteClaimModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  claimSubject?: string;
  isDeleting?: boolean;
}

function DeleteClaimModal({ isVisible, onClose, onConfirm, claimSubject, isDeleting = false }: DeleteClaimModalProps) {
  return (
    <GenericConfirmModal
      isVisible={isVisible}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Eliminar Reclamo"
      description="Esta acción no se puede deshacer. Una vez eliminado, no podrás recuperar este reclamo."
      itemName={claimSubject}
      confirmText={isDeleting ? 'Eliminando...' : 'Eliminar'}
      cancelText="Cancelar"
      variant="danger"
      icon={AlertTriangle}
      isLoading={isDeleting}
    />
  );
}

export default DeleteClaimModal;