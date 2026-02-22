import { FileText, Layers } from 'lucide-react';
import GenericFilterModal from './GenericFilterModal';
import type { FilterOption } from './GenericFilterModal';
import type { UserExpenseTypeWithSubtypes } from '../api_calls/user_expenses';
import { TYPE_ICONS } from '../utils/expensesHelpers';

interface ExpenseTypeFilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedTypeId: string;
  onTypeSelect: (typeId: string) => void;
  expenseTypes: UserExpenseTypeWithSubtypes[];
}

function ExpenseTypeFilterModal({
  isVisible,
  onClose,
  selectedTypeId,
  onTypeSelect,
  expenseTypes,
}: ExpenseTypeFilterModalProps) {
  const options: FilterOption[] = [
    {
      value: '',
      label: 'Todos los tipos',
      icon: FileText,
      description: 'Ver expensas sin filtrar por tipo',
    },
    ...expenseTypes.map((t) => ({
      value: String(t.id),
      label: t.label,
      icon: TYPE_ICONS[t.name] ?? FileText,
      description:
        t.subtypes.length > 0
          ? `${t.subtypes.length} subtipo${t.subtypes.length !== 1 ? 's' : ''} disponible${t.subtypes.length !== 1 ? 's' : ''}`
          : undefined,
    })),
  ];

  return (
    <GenericFilterModal
      isVisible={isVisible}
      onClose={onClose}
      selectedValue={selectedTypeId}
      onValueSelect={onTypeSelect}
      options={options}
      title="Filtrar por Tipo"
      subtitle="Selecciona un tipo de expensa para filtrar"
      headerIcon={Layers}
      headerIconColor="text-indigo-600"
      maxWidth="2xl"
    />
  );
}

export default ExpenseTypeFilterModal;
