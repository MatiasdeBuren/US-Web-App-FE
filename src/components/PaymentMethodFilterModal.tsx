import { CreditCard, Banknote, Building2, Wallet, HelpCircle } from 'lucide-react';
import GenericFilterModal from './GenericFilterModal';
import type { FilterOption } from './GenericFilterModal';
import type { PaymentMethod } from '../api_calls/expenses';

interface PaymentMethodFilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedMethodId: number | '';
  onMethodSelect: (id: number | '') => void;
  paymentMethods: PaymentMethod[];
}

function getMethodIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes('transferencia')) return Building2;
  if (l.includes('tarjeta') || l.includes('débito') || l.includes('crédito')) return CreditCard;
  if (l.includes('efectivo')) return Banknote;
  return Wallet;
}

function PaymentMethodFilterModal({
  isVisible,
  onClose,
  selectedMethodId,
  onMethodSelect,
  paymentMethods,
}: PaymentMethodFilterModalProps) {
  const options: FilterOption[] = [
    {
      value: '',
      label: 'Sin especificar',
      icon: HelpCircle,
      description: 'No indicar método de pago',
    },
    ...paymentMethods.map((m) => ({
      value: String(m.id),
      label: m.label,
      icon: getMethodIcon(m.label),
    })),
  ];

  return (
    <GenericFilterModal
      isVisible={isVisible}
      onClose={onClose}
      selectedValue={selectedMethodId === '' ? '' : String(selectedMethodId)}
      onValueSelect={(val) => onMethodSelect(val === '' ? '' : parseInt(val) as number)}
      options={options}
      title="Método de pago"
      subtitle="Selecciona cómo se realizó el pago"
      headerIcon={CreditCard}
      headerIconColor="text-emerald-600"
      maxWidth="md"
    />
  );
}

export default PaymentMethodFilterModal;
