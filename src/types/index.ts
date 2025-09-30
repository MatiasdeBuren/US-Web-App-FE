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

export interface Reservation {
    id: number;
    startTime: string;
    endTime: string;
    status: string;
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
}