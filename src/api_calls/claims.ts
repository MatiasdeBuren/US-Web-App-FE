// API calls para la funcionalidad de reclamos/claims
const API_URL = import.meta.env.VITE_API_URL as string;

// Tipos para las respuestas de claims
export interface Claim {
    id: number;
    subject: string;
    category: 'ascensor' | 'plomeria' | 'electricidad' | 'temperatura' | 'areas_comunes' | 'edificio' | 'otro';
    description: string;
    location: string;
    priority: 'baja' | 'media' | 'alta' | 'urgente';
    status: 'pendiente' | 'en_progreso' | 'resuelto' | 'rechazado';
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    userId?: number; // ID del usuario que creó el reclamo
    adminNotes?: string; // Notas administrativas agregadas por el admin
    adhesion_counts?: {
        support: number;
        disagree: number;
    };
    user_adhesion?: 'support' | 'disagree' | null;
}

export interface CreateClaimData {
    subject: string;
    category: 'ascensor' | 'plomeria' | 'electricidad' | 'temperatura' | 'areas_comunes' | 'edificio' | 'otro';
    description: string;
    location: string;
    priority: 'baja' | 'media' | 'alta' | 'urgente';
}

export interface UpdateClaimData {
    subject?: string;
    category?: 'ascensor' | 'plomeria' | 'electricidad' | 'temperatura' | 'areas_comunes' | 'edificio' | 'otro';
    description?: string;
    location?: string;
    priority?: 'baja' | 'media' | 'alta' | 'urgente';
    status?: 'pendiente' | 'en_progreso' | 'resuelto' | 'rechazado';
}

export interface ClaimsListResponse {
    claims: Claim[];
    total: number;
    page: number;
    limit: number;
}

// ================================
// FUNCIONES DE GESTIÓN DE RECLAMOS
// ================================

// GET /claims - Obtener reclamos del usuario (con opción de incluir todos)
export async function getClaims(
    token: string,
    options?: {
        page?: number;
        limit?: number;
        category?: string;
        status?: string;
        search?: string;
        includeAll?: boolean;
    }
): Promise<ClaimsListResponse> {
    try {
        const params = new URLSearchParams();
        if (options?.page) params.append('page', options.page.toString());
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.category && options.category !== 'all') params.append('category', options.category);
        if (options?.status && options.status !== 'all') params.append('status', options.status);
        if (options?.search) params.append('search', options.search);
        if (options?.includeAll) params.append('includeAll', 'true');

        const url = `${API_URL}/claims${params.toString() ? `?${params.toString()}` : ''}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token de autenticación inválido.');
            }
            if (response.status === 403) {
                throw new Error('Acceso denegado.');
            }
            throw new Error(`Error del servidor: ${response.status}`);
        }

        const data = await response.json();
        
        // Validar que la respuesta tenga la estructura esperada
        return {
            claims: Array.isArray(data.claims) ? data.claims : [],
            total: data.total || 0,
            page: data.page || 1,
            limit: data.limit || 10
        };
    } catch (error) {
        console.error('Error en getClaims:', error);
        throw error;
    }
}

// GET /claims/:id - Obtener un reclamo específico
export async function getClaim(token: string, claimId: number): Promise<Claim> {
    try {
        const response = await fetch(`${API_URL}/claims/${claimId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token de autenticación inválido.');
            }
            if (response.status === 403) {
                throw new Error('Acceso denegado.');
            }
            if (response.status === 404) {
                throw new Error('Reclamo no encontrado.');
            }
            throw new Error(`Error del servidor: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error('Error en getClaim:', error);
        throw error;
    }
}

// POST /claims - Crear un nuevo reclamo
export async function createClaim(
    token: string, 
    claimData: CreateClaimData
): Promise<Claim> {
    try {
        const response = await fetch(`${API_URL}/claims`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(claimData)
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token de autenticación inválido.');
            }
            if (response.status === 403) {
                throw new Error('Acceso denegado.');
            }
            if (response.status === 400) {
                const error = await response.json();
                throw new Error(error.message || 'Datos de reclamo inválidos.');
            }
            const error = await response.json();
            throw new Error(error.message || `Error al crear reclamo: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error('Error en createClaim:', error);
        throw error;
    }
}

// PUT /claims/:id - Actualizar un reclamo existente
export async function updateClaim(
    token: string, 
    claimId: number,
    claimData: UpdateClaimData
): Promise<Claim> {
    try {
        const response = await fetch(`${API_URL}/claims/${claimId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(claimData)
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token de autenticación inválido.');
            }
            if (response.status === 403) {
                throw new Error('Acceso denegado. Solo puedes actualizar tus propios reclamos.');
            }
            if (response.status === 404) {
                throw new Error('Reclamo no encontrado.');
            }
            if (response.status === 400) {
                const error = await response.json();
                throw new Error(error.message || 'Datos de reclamo inválidos.');
            }
            const error = await response.json();
            throw new Error(error.message || `Error al actualizar reclamo: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error('Error en updateClaim:', error);
        throw error;
    }
}

// DELETE /claims/:id - Eliminar un reclamo
export async function deleteClaim(token: string, claimId: number): Promise<void> {
    try {
        const response = await fetch(`${API_URL}/claims/${claimId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token de autenticación inválido.');
            }
            if (response.status === 403) {
                throw new Error('Acceso denegado. Solo puedes eliminar tus propios reclamos.');
            }
            if (response.status === 404) {
                throw new Error('Reclamo no encontrado.');
            }
            if (response.status === 409) {
                throw new Error('No se puede eliminar: el reclamo está siendo procesado.');
            }
            const error = await response.json();
            throw new Error(error.message || `Error al eliminar reclamo: ${response.status}`);
        }
    } catch (error) {
        console.error('Error en deleteClaim:', error);
        throw error;
    }
}

// ================================
// FUNCIONES DE GESTIÓN ADMIN DE RECLAMOS
// ================================

// GET /admin/claims - Obtener todos los reclamos (solo admin)
export async function getAdminClaims(
    token: string,
    options?: {
        page?: number;
        limit?: number;
        category?: string;
        status?: string;
        search?: string;
        userId?: number;
    }
): Promise<ClaimsListResponse> {
    try {
        const params = new URLSearchParams();
        if (options?.page) params.append('page', options.page.toString());
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.category && options.category !== 'all') params.append('category', options.category);
        if (options?.status && options.status !== 'all') params.append('status', options.status);
        if (options?.search) params.append('search', options.search);
        if (options?.userId) params.append('userId', options.userId.toString());

        const url = `${API_URL}/admin/claims${params.toString() ? `?${params.toString()}` : ''}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Acceso denegado. Se requieren permisos de administrador.');
            }
            if (response.status === 401) {
                throw new Error('Token de autenticación inválido.');
            }
            throw new Error(`Error del servidor: ${response.status}`);
        }

        const data = await response.json();
        
        return {
            claims: Array.isArray(data.claims) ? data.claims : [],
            total: data.total || 0,
            page: data.page || 1,
            limit: data.limit || 10
        };
    } catch (error) {
        console.error('Error en getAdminClaims:', error);
        throw error;
    }
}

// PUT /admin/claims/:id/status - Actualizar el estado de un reclamo (solo admin)
export async function updateClaimStatus(
    token: string, 
    claimId: number,
    status: 'pendiente' | 'en_progreso' | 'resuelto' | 'rechazado',
    adminNotes?: string
): Promise<Claim> {
    try {
        const response = await fetch(`${API_URL}/admin/claims/${claimId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status, adminNotes })
        });

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Acceso denegado. Se requieren permisos de administrador.');
            }
            if (response.status === 401) {
                throw new Error('Token de autenticación inválido.');
            }
            if (response.status === 404) {
                throw new Error('Reclamo no encontrado.');
            }
            if (response.status === 400) {
                const error = await response.json();
                throw new Error(error.message || 'Estado de reclamo inválido.');
            }
            const error = await response.json();
            throw new Error(error.message || `Error al actualizar estado del reclamo: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error('Error en updateClaimStatus:', error);
        throw error;
    }
}

// DELETE /admin/claims/:id - Eliminar cualquier reclamo (solo admin)
export async function deleteAdminClaim(token: string, claimId: number): Promise<void> {
    try {
        const response = await fetch(`${API_URL}/admin/claims/${claimId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Acceso denegado. Se requieren permisos de administrador.');
            }
            if (response.status === 401) {
                throw new Error('Token de autenticación inválido.');
            }
            if (response.status === 404) {
                throw new Error('Reclamo no encontrado.');
            }
            const error = await response.json();
            throw new Error(error.message || `Error al eliminar reclamo: ${response.status}`);
        }
    } catch (error) {
        console.error('Error en deleteAdminClaim:', error);
        throw error;
    }
}

// ================================
// FUNCIONES DE ADHESIÓN A RECLAMOS
// ================================

// GET /claims/:id/adhesions - Obtener adhesiones de un reclamo
export async function getClaimAdhesions(token: string, claimId: number): Promise<{
    total_support: number;
    total_disagree: number;
    user_adhesion: 'support' | 'disagree' | null;
}> {
    try {
        const response = await fetch(`${API_URL}/claims/${claimId}/adhesions`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token de autenticación inválido.');
            }
            if (response.status === 404) {
                throw new Error('Reclamo no encontrado.');
            }
            throw new Error(`Error del servidor: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error('Error en getClaimAdhesions:', error);
        throw error;
    }
}

// POST /claims/:id/adhesions - Crear/actualizar adhesión
export async function createClaimAdhesion(
    token: string, 
    claimId: number, 
    adhesionType: 'support' | 'disagree'
): Promise<{ message: string; adhesion_type: string }> {
    try {
        const response = await fetch(`${API_URL}/claims/${claimId}/adhesions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ adhesion_type: adhesionType })
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token de autenticación inválido.');
            }
            if (response.status === 403) {
                throw new Error('No puedes adherirte a tu propio reclamo.');
            }
            if (response.status === 404) {
                throw new Error('Reclamo no encontrado.');
            }
            if (response.status === 400) {
                const error = await response.json();
                throw new Error(error.message || 'Datos de adhesión inválidos.');
            }
            throw new Error(`Error del servidor: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error('Error en createClaimAdhesion:', error);
        throw error;
    }
}

// DELETE /claims/:id/adhesions - Eliminar adhesión del usuario
export async function deleteClaimAdhesion(token: string, claimId: number): Promise<{ message: string }> {
    try {
        const response = await fetch(`${API_URL}/claims/${claimId}/adhesions`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Token de autenticación inválido.');
            }
            if (response.status === 404) {
                throw new Error('Adhesión no encontrada.');
            }
            throw new Error(`Error del servidor: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error('Error en deleteClaimAdhesion:', error);
        throw error;
    }
}