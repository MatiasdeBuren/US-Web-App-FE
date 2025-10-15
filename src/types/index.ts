// Tipos reutilizables para todo el proyecto

export interface UserData {
    user: {
        name: string;
        email: string;
        role?: string; // "admin" | "tenant" | "owner"
        iat: number;
        exp: number;
    };
    message: string;
}

export interface ReservationData {
    [space: string]: {
        [time: string]: number;
    };
}

export interface ReservationStatus {
    id: number;
    name: string; // "pendiente", "confirmada", "cancelada", "finalizada"
    label: string; // Spanish labels for display
}

export interface Reservation {
    id: number;
    startTime: string;
    endTime: string;
    status: ReservationStatus;
    amenity: {
        id: number;
        name: string;
    };
}

export interface Amenity {
    id: number;
    name: string;
    capacity: number;
    maxDuration: number;
    openTime?: string;  // Format: "HH:mm"
    closeTime?: string; // Format: "HH:mm"
    isActive: boolean;
    requiresApproval?: boolean; // Whether this amenity requires admin approval for reservations
}