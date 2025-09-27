import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import { resetPassword } from '../api_calls/reset_password';

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; token?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      setErrors({ token: 'Token de restablecimiento inválido o faltante' });
    } else {
      setToken(tokenFromUrl);
    }
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempErrors: typeof errors = {};

    // Validation
    if (!newPassword) {
      tempErrors.password = 'La contraseña es obligatoria';
    } else {
      if (newPassword.length < 6) {
        tempErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      } else if (!/[A-Z]/.test(newPassword)) {
        tempErrors.password = 'La contraseña debe tener al menos una letra mayúscula';
      } else if (!/[0-9]/.test(newPassword)) {
        tempErrors.password = 'La contraseña debe tener al menos un número';
      }
    }

    if (newPassword !== confirmPassword) {
      tempErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!token) {
      tempErrors.token = 'Token de restablecimiento inválido';
    }

    setErrors(tempErrors);

    if (Object.keys(tempErrors).length === 0 && token) {
      setIsLoading(true);
      try {
        await resetPassword({ token, newPassword });
        setIsSuccess(true);
      } catch (err) {
        setErrors({ password: err instanceof Error ? err.message : 'Error al restablecer la contraseña' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-300 to-gray-600">
        <div className="bg-gradient-to-b from-white via-gray-50 to-gray-200 rounded-3xl shadow-xl p-10 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">¡Contraseña actualizada!</h1>
            <p className="text-gray-600 mb-6">
              Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.
            </p>
            <button
              onClick={handleBackToLogin}
              className="w-full bg-gradient-to-r from-gray-400 via-gray-500 to-gray-700 text-white font-bold py-3 rounded-lg shadow-md hover:from-gray-500 hover:via-gray-600 hover:to-gray-800 transition-all transform hover:scale-105 cursor-pointer"
            >
              Ir a iniciar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-300 to-gray-600">
      <div className="bg-gradient-to-b from-white via-gray-50 to-gray-200 rounded-3xl shadow-xl p-10 max-w-md w-full animate-fadeIn">
        <div className="text-center mb-6">
          <img src="src/assets/Logo_Us_2.png" alt="Logo US" className="mx-auto w-20 h-20" />
          <h1 className="text-3xl font-bold text-gray-800">Restablecer contraseña</h1>
          <p className="text-gray-500 mt-2">Ingresa tu nueva contraseña</p>
        </div>

        {errors.token && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
            <p className="font-semibold">Error de enlace</p>
            <p className="text-sm">{errors.token}</p>
            <button
              onClick={handleBackToLogin}
              className="mt-3 text-red-800 hover:underline cursor-pointer"
            >
              Volver al inicio de sesión
            </button>
          </div>
        )}

        {!errors.token && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            {/* New Password */}
            <div className="relative">
              <HiOutlineLockClosed className="absolute top-3 left-3 text-gray-500" size={20} />
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={() => setShowPasswordRequirements(true)}
                onBlur={() => setShowPasswordRequirements(false)}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all ${errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 cursor-pointer"
                disabled={isLoading}
                aria-label={showNewPassword ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}
              >
                {showNewPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
              </button>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              
              {/* Password requirements - only shown when focused */}
              {showPasswordRequirements && (
                <div className="mt-2 text-xs space-y-1">
                  <p className="text-gray-600 font-medium">La contraseña debe tener:</p>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${newPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span className={newPassword.length >= 6 ? 'text-green-600' : 'text-gray-500'}>
                      Al menos 6 caracteres
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${/[A-Z]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span className={/[A-Z]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}>
                      Al menos una letra mayúscula
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${/[0-9]/.test(newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span className={/[0-9]/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}>
                      Al menos un número
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <HiOutlineLockClosed className="absolute top-3 left-3 text-gray-500" size={20} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirmar nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 cursor-pointer"
                disabled={isLoading}
                aria-label={showConfirmPassword ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"}
              >
                {showConfirmPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
              </button>
              {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full cursor-pointer bg-gradient-to-r from-gray-400 via-gray-500 to-gray-700 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-xl transition-all transform hover:scale-105 hover:from-gray-500 hover:via-gray-600 hover:to-gray-800 duration-300 disabled:opacity-50 disabled:transform-none"
              disabled={isLoading}
            >
              {isLoading ? 'Restableciendo...' : 'Restablecer contraseña'}
            </button>
          </form>
        )}

        {/* Footer */}
        <p className="text-center text-gray-600 mt-6">
          ¿Recordaste tu contraseña?{' '}
          <span
            className="text-gray-800 hover:underline cursor-pointer"
            onClick={handleBackToLogin}
          >
            Iniciar sesión
          </span>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;