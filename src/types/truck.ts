export interface Box {
    id: number;
    length: number;
    width: number;
    height: number;
}

export interface Orientation {
    horizontal: number;
    vertical: number;
    rotated: boolean;
}

export interface Placement {
    box: Box;
    position: { x: number; y: number };
    orientation: Orientation;
}

export interface Vehicle {
    id: string;
    vehicle_name: string;
    vehicle_code: string;
    truck_length_cm: number;
    truck_width_cm: number;
    max_pallets: number;
    vehicle_category: string;
    max_length_m: number;
    max_width_m: number;
    max_height_m: number;
    max_weight_kg: number | null;
    max_cbm: number | null;
}

export interface CalculationResult {
    placements: Placement[];
    occupiedSpaces: number[];
    spaceDetails: Record<number, number[]>;
    spaceCount: number;
}

export interface FindVehicleInput {
    total_pallets: number;
    max_length: number;
    max_width: number;
    max_height: number;
    total_weight: number;
    total_cbm: number;
}

export interface FindVehicleResponse {
    findSuitableVehicle: {
        vehicle: Vehicle;
        needs_semi: boolean;
        needs_bdouble: boolean;
        needs_flatbed: boolean;
    };
}