import { Clock, CheckCircle, AlertCircle, XCircle, Filter } from 'lucide-react';
import GenericFilterModal from './GenericFilterModal';
import type { FilterOption } from './GenericFilterModal';

interface ExpenseStatusFilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedStatus: string;
  onStatusSelect: (status: string) => void;
}

const statusOptions: FilterOption[] = [
  {
    value: '',
    label: 'Todos los estados',
    icon: Filter,
    description: 'Ver expensas sin filtrar por estado',
  },
  {
    value: '1',
    label: 'Pendiente',
    icon: Clock,
    description: 'Expensas que aún no han sido pagadas',
  },
  {
    value: '2',
    label: 'Parcial',
    icon: AlertCircle,
    description: 'Expensas con pago parcial registrado',
  },
  {
    value: '3',
    label: 'Pagado',
    icon: CheckCircle,
    description: 'Expensas completamente abonadas',
  },
  {
    value: '4',
    label: 'Vencido',
    icon: XCircle,
    description: 'Expensas cuya fecha de vencimiento ya pasó',
  },
];

function ExpenseStatusFilterModal({
  isVisible,
  onClose,
  selectedStatus,
  onStatusSelect,
}: ExpenseStatusFilterModalProps) {
  return (
    <GenericFilterModal
      isVisible={isVisible}
      onClose={onClose}
      selectedValue={selectedStatus}
      onValueSelect={onStatusSelect}
      options={statusOptions}
      title="Filtrar por Estado"
      subtitle="Selecciona un estado para filtrar tus expensas"
      headerIcon={Filter}
      headerIconColor="text-indigo-600"
      maxWidth="2xl"
    />
  );
}

export default ExpenseStatusFilterModal;
