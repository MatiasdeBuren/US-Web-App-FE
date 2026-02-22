import { Tag } from 'lucide-react';
import GenericFilterModal from './GenericFilterModal';
import type { FilterOption } from './GenericFilterModal';
import type { UserExpenseSubtype } from '../api_calls/user_expenses';

interface ExpenseSubtypeFilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedSubtypeId: string;
  onSubtypeSelect: (subtypeId: string) => void;
  subtypes: UserExpenseSubtype[];
  parentTypeLabel?: string;
}

function ExpenseSubtypeFilterModal({
  isVisible,
  onClose,
  selectedSubtypeId,
  onSubtypeSelect,
  subtypes,
  parentTypeLabel,
}: ExpenseSubtypeFilterModalProps) {
  const options: FilterOption[] = [
    {
      value: '',
      label: 'Todos los subtipos',
      icon: Tag,
      description: parentTypeLabel
        ? `Ver todos los subtipos de ${parentTypeLabel}`
        : 'Ver todos los subtipos',
    },
    ...subtypes.map((s) => ({
      value: String(s.id),
      label: s.label,
      icon: Tag,
    })),
  ];

  return (
    <GenericFilterModal
      isVisible={isVisible}
      onClose={onClose}
      selectedValue={selectedSubtypeId}
      onValueSelect={onSubtypeSelect}
      options={options}
      title="Filtrar por Subtipo"
      subtitle={parentTypeLabel ? `Subtipos de ${parentTypeLabel}` : 'Selecciona un subtipo'}
      headerIcon={Tag}
      headerIconColor="text-purple-600"
      maxWidth="2xl"
    />
  );
}

export default ExpenseSubtypeFilterModal;
