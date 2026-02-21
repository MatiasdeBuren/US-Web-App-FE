import { CheckCircle } from 'lucide-react';
import GenericToast from './GenericToast';

interface ExpenseSuccessToastProps {
  isVisible: boolean;
  onComplete: () => void;
  action?: 'created' | 'deleted' | 'payment';
  unitLabel?: string;
}

function ExpenseSuccessToast({
  isVisible,
  onComplete,
  action = 'created',
  unitLabel,
}: ExpenseSuccessToastProps) {
  const getTitle = () => {
    switch (action) {
      case 'created': return 'Expensa creada';
      case 'deleted': return 'Expensa eliminada';
      case 'payment': return 'Pago registrado';
      default: return 'Operación exitosa';
    }
  };

  const getMessage = () => {
    switch (action) {
      case 'created':
        return unitLabel
          ? `La expensa para la unidad ${unitLabel} fue creada exitosamente.`
          : 'La expensa fue creada exitosamente.';
      case 'deleted':
        return 'La expensa fue eliminada exitosamente.';
      case 'payment':
        return 'El pago fue registrado exitosamente.';
      default:
        return 'La operación se realizó exitosamente.';
    }
  };

  return (
    <GenericToast
      isVisible={isVisible}
      onComplete={onComplete}
      title={getTitle()}
      message={getMessage()}
      type={action === 'deleted' ? 'warning' : 'success'}
      icon={CheckCircle}
      position="top-right"
      duration={4000}
    />
  );
}

export default ExpenseSuccessToast;
