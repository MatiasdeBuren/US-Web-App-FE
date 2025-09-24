import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineHome, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import { register } from '../api_calls/auth';
import { getApartments, type Apartment } from '../api_calls/get_apartments';
import RegistrationSuccessToast from '../components/RegistrationSuccessToast';

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apartmentId, setApartmentId] = useState<string>('');
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    apartment?: string;
  }>({});

  useEffect(() => {
    const loadApartments = async () => {
      try {
        const apartmentData = await getApartments();
        setApartments(apartmentData);
      } catch (error) {
        console.error('Error loading apartments:', error);
      }
    };
    loadApartments();
  }, []);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const tempErrors: typeof errors = {};

    if (!name) tempErrors.name = 'El nombre es obligatorio';
    if (!email) tempErrors.email = 'El correo es obligatorio';
    if (!password) {
      tempErrors.password = 'La contraseña es obligatoria';
    } else {
      // Password validation with same conditions as ChangePasswordModal
      if (password.length < 6) {
        tempErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      } else if (!/[A-Z]/.test(password)) {
        tempErrors.password = 'La contraseña debe tener al menos una letra mayúscula';
      } else if (!/[0-9]/.test(password)) {
        tempErrors.password = 'La contraseña debe tener al menos un número';
      }
    }
    if (password !== confirmPassword) tempErrors.confirmPassword = 'Las contraseñas no coinciden';
    if (apartmentId === '') tempErrors.apartment = 'Debes seleccionar un apartamento';

    setErrors(tempErrors);

    if (Object.keys(tempErrors).length === 0) {
      register({
        name,
        email,
        password,
        apartmentId
      }).then((result) => {
        if (result.success) {
          setShowSuccessToast(true);
        } else {
          setErrors({ email: result.message || 'Error en el registro' });
        }
      });
    }
  };

  const handleToastComplete = () => {
    setShowSuccessToast(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-300 to-gray-600">
      <div className="bg-gradient-to-b from-white via-gray-50 to-gray-200 rounded-3xl shadow-xl p-10 max-w-md w-full animate-fadeIn">
        <div className="text-center mb-6">
          <img src="src/assets/Logo_Us_2.png" alt="Logo US" className="mx-auto w-20 h-20 animate-bounce" />
          <h1 className="text-3xl font-bold text-gray-800">Crear cuenta</h1>
          <p className="text-gray-500 mt-2">Registrate para gestionar tu consorcio</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          {/* Name */}
          <div className="relative">
            <HiOutlineUser className="absolute top-3 left-3 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all ${errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="relative">
            <HiOutlineMail className="absolute top-3 left-3 text-gray-500" size={20} />
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all ${errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Apartment */}
           <div className="relative">
            <HiOutlineHome className="absolute top-3 left-3 text-gray-500" size={20} />
            <select
              value={apartmentId || ''}
              onChange={(e) => setApartmentId(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all cursor-pointer bg-white ${errors.apartment ? 'border-red-500' : 'border-gray-300'
                }`}
            >
              <option value="">Selecciona un apartamento</option>
              {apartments.map((apartment) => (
                <option key={apartment.id} value={apartment.id}>
                  {apartment.unit}
                </option>
              ))}
            </select>
            {errors.apartment && <p className="text-red-500 text-sm mt-1">{errors.apartment}</p>}
          </div> 

          {/* Password */}
          <div className="relative">
            <HiOutlineLockClosed className="absolute top-3 left-3 text-gray-500" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setShowPasswordRequirements(true)}
              onBlur={() => setShowPasswordRequirements(false)}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all ${errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              onMouseDown={(e) => e.preventDefault()} // Prevent focus loss from input
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 cursor-pointer"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
            </button>
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}

            {/* Password requirements - only shown when focused */}
            {showPasswordRequirements && (
              <div className="mt-2 text-xs space-y-1">
                <p className="text-gray-600 font-medium">La contraseña debe tener:</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${password.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  <span className={password.length >= 6 ? 'text-green-600' : 'text-gray-500'}>
                    Al menos 6 caracteres
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${/[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  <span className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                    Al menos una letra mayúscula
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${/[0-9]/.test(password) ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  <span className={/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
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
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              onMouseDown={(e) => e.preventDefault()} // Prevent focus loss from input
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 cursor-pointer"
              aria-label={showConfirmPassword ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"}
            >
              {showConfirmPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
            </button>
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Register button */}
          <button
            type="submit"
            className="w-full cursor-pointer bg-gradient-to-r from-gray-400 via-gray-500 to-gray-700 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-xl transition-all transform hover:scale-105 hover:from-gray-500 hover:via-gray-600 hover:to-gray-800 duration-300"
          >
            Registrarse
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-600 mt-6">
          ¿Ya tenés cuenta?{' '}
          <span
            className="text-gray-800 hover:underline cursor-pointer"
            onClick={() => navigate('/login')}
          >
            Iniciar sesión
          </span>
        </p>
      </div>

      {/* Registration Success Toast */}
      <RegistrationSuccessToast
        isVisible={showSuccessToast}
        onComplete={handleToastComplete}
      />
    </div>
  );
}

export default Register;
