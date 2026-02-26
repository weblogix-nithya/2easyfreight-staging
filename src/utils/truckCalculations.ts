// src/utils/truckCalculations.ts

import { Box, Orientation, Placement, Vehicle } from '../types/truck';

const PALLET_SIZE = 120;
const TRUCK_WIDTH = 240; // 2 pallets
const TRUCK_LENGTH = 840; // 7 pallets
const PALLET_CBM = 1.728;

/* =========================================================
   COLLISION CHECK
========================================================= */
export function hasConflict(
    position: { x: number; y: number },
    orientation: Orientation,
    placements: Placement[]
): boolean {
    for (const p of placements) {
        const noOverlap =
            position.x + orientation.horizontal <= p.position.x ||
            p.position.x + p.orientation.horizontal <= position.x ||
            position.y + orientation.vertical <= p.position.y ||
            p.position.y + p.orientation.vertical <= position.y;

        if (!noOverlap) return true;
    }
    return false;
}

/* =========================================================
   PALLET INDEX CALCULATION
========================================================= */
export function calculateTouchedSpaces(
    position: { x: number; y: number },
    orientation: Orientation,
    vehicle?: Vehicle
): Set<number> {
    const spaces = new Set<number>();

    if (vehicle) {
        // New version: Use vehicle dimensions
        const numCols = vehicle.truck_width_cm / PALLET_SIZE;
        const numRows = vehicle.truck_length_cm / PALLET_SIZE;

        const startCol = Math.floor(position.x / PALLET_SIZE);
        const endCol = Math.floor((position.x + orientation.horizontal - 1) / PALLET_SIZE);
        const startRow = Math.floor(position.y / PALLET_SIZE);
        const endRow = Math.floor((position.y + orientation.vertical - 1) / PALLET_SIZE);

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                if (r < numRows && c < numCols) {
                    spaces.add(r * numCols + c + 1);
                }
            }
        }
    } else {
        // Original version: Use fixed truck dimensions
        const startCol = Math.floor(position.x / PALLET_SIZE);
        const endCol = Math.floor(
            (position.x + orientation.horizontal - 1) / PALLET_SIZE
        );

        const startRow = Math.floor(position.y / PALLET_SIZE);
        const endRow = Math.floor(
            (position.y + orientation.vertical - 1) / PALLET_SIZE
        );

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                if (r < 7 && c < 2) {
                    spaces.add(r * 2 + c + 1);
                }
            }
        }
    }

    return spaces;
}

/* =========================================================
   PALLET SPACE CALCULATION (CORE ENGINE)
========================================================= */
export function calculatePalletSpacesOccupied(
    boxes: Box[],
    vehicle?: Vehicle
): number {
    if (boxes.length === 0) return 0;

    const placements: Placement[] = [];
    const TRUCK_W = vehicle ? vehicle.truck_width_cm : TRUCK_WIDTH;
    const TRUCK_L = vehicle ? vehicle.truck_length_cm : TRUCK_LENGTH;

    // Big footprint first
    const sortedBoxes = [...boxes].sort(
        (a, b) => b.length * b.width - a.length * a.width
    );

    for (const box of sortedBoxes) {
        const orientations: Orientation[] = [
            { horizontal: box.width, vertical: box.length, rotated: false },
            { horizontal: box.length, vertical: box.width, rotated: true },
        ];

        let placed = false;

        for (const orientation of orientations) {
            if (orientation.horizontal > TRUCK_W) continue;

            for (let y = 0; y <= TRUCK_L - orientation.vertical && !placed; y++) {
                for (let x = 0; x <= TRUCK_W - orientation.horizontal && !placed; x++) {
                    if (!hasConflict({ x, y }, orientation, placements)) {
                        placements.push({
                            box,
                            position: { x, y },
                            orientation,
                        });
                        placed = true;
                    }
                }
            }

            if (placed) break;
        }
    }

    // Count touched pallet spaces
    const occupied = new Set<number>();

    placements.forEach((p) => {
        const touched = calculateTouchedSpaces(
            p.position,
            p.orientation,
            vehicle
        );
        touched.forEach((s) => occupied.add(s));
    });

    return occupied.size;
}

/* =========================================================
   PALLET SPACE CALCULATION WITH DETAILS (FOR VISUALIZATION)
========================================================= */
export function calculatePalletSpacesWithDetails(
    boxes: Box[],
    vehicle: Vehicle
) {
    if (!vehicle) {
        console.error("❌ No vehicle provided");
        return {
            placements: [],
            occupiedSpaces: [],
            spaceDetails: {},
            spaceCount: 0
        };
    }

    const TRUCK_WIDTH = vehicle.truck_width_cm;
    const TRUCK_LENGTH = vehicle.truck_length_cm;

    const placements: Placement[] = [];
    const sortedBoxes = [...boxes].sort(
        (a, b) => b.length * b.width - a.length * a.width
    );

    for (const box of sortedBoxes) {
        const orientations: Orientation[] = [
            { horizontal: box.width, vertical: box.length, rotated: false },
            { horizontal: box.length, vertical: box.width, rotated: true }
        ];

        let placed = false;

        for (const orientation of orientations) {
            if (orientation.horizontal > TRUCK_WIDTH) continue;
            if (orientation.vertical > TRUCK_LENGTH) continue;

            for (let y = 0; y <= TRUCK_LENGTH - orientation.vertical && !placed; y += 5) {
                for (let x = 0; x <= TRUCK_WIDTH - orientation.horizontal && !placed; x += 5) {
                    if (!hasConflict({ x, y }, orientation, placements)) {
                        placements.push({
                            box,
                            position: { x, y },
                            orientation
                        });
                        placed = true;
                    }
                }
            }
            if (placed) break;
        }

        if (!placed) {
            console.warn(`⚠️ Box ${box.id} could not be placed`);
        }
    }

    const occupiedSpaces = new Set<number>();
    const spaceDetails: Record<number, number[]> = {};

    placements.forEach(placement => {
        const spaces = calculateTouchedSpaces(
            placement.position,
            placement.orientation,
            vehicle
        );
        spaces.forEach(spaceNum => {
            occupiedSpaces.add(spaceNum);
            if (!spaceDetails[spaceNum]) spaceDetails[spaceNum] = [];
            spaceDetails[spaceNum].push(placement.box.id);
        });
    });

    return {
        placements,
        occupiedSpaces: Array.from(occupiedSpaces).sort((a, b) => a - b),
        spaceDetails,
        spaceCount: occupiedSpaces.size
    };
}

/* =========================================================
   VERTICAL CHAIN STRATEGY
========================================================= */
export function calculatePalletSpacesVerticalChain(
    boxes: Box[],
    vehicle?: Vehicle
): number {
    const occupied = new Set<number>();
    const TRUCK_L = vehicle ? vehicle.truck_length_cm : TRUCK_LENGTH;

    boxes.forEach((box, i) => {
        const position = { x: 0, y: i * 120 };
        const orientation = {
            horizontal: 120,
            vertical: 140,
            rotated: false,
        };

        if (position.y + orientation.vertical <= TRUCK_L) {
            const touched = calculateTouchedSpaces(position, orientation, vehicle);
            touched.forEach((s) => occupied.add(s));
        }
    });

    return occupied.size;
}

/* =========================================================
   MULTI STRATEGY OPTIMIZER
========================================================= */
export function calculateEfficientPalletSpaces(
    boxes: Box[],
    vehicle?: Vehicle
): number {
    if (boxes.length === 0) return 0;

    const similar = boxes.every(
        (b) =>
            b.length >= 120 && b.length <= 160 &&
            b.width >= 100 && b.width <= 140
    );

    if (!similar) {
        return calculatePalletSpacesOccupied(boxes, vehicle);
    }

    const standard = calculatePalletSpacesOccupied(boxes, vehicle);
    const vertical = calculatePalletSpacesVerticalChain(boxes, vehicle);

    return Math.min(standard, vertical);
}

/* =========================================================
   EXTRACT BOXES FROM JOB ITEMS
========================================================= */
export function extractBoxesFromJobItems(jobItems: any[]): Box[] {
    let boxes: Box[] = [];
    let boxId = 1;

    jobItems.forEach((item) => {
        const qty = Number(item.quantity || 0);

        // meters → cm
        const length = Number(item.dimension_depth || 0) * 100;
        const width = Number(item.dimension_width || 0) * 100;
        const height = Number(item.dimension_height || 0) * 100;

        if (qty > 0 && length > 0 && width > 0 && height > 0) {
            for (let i = 0; i < qty; i++) {
                boxes.push({
                    id: boxId++,
                    length,
                    width,
                    height,
                });
            }
        }
    });

    return boxes;
}

/* =========================================================
   CALCULATE PALLET SPACES FROM JOB ITEMS
========================================================= */
export function calculatePalletSpacesOccupiedFromData(
    data: any[],
    vehicle?: Vehicle
): number {
    const boxes = extractBoxesFromJobItems(data);
    return calculatePalletSpacesOccupied(boxes, vehicle);
}

/* =========================================================
   FINAL CBM + WEIGHT CALCULATION
========================================================= */
export function calculateFinalWeightCBM(
    job_category_id: any,
    jobItems: any[],
    companyWeight: number,
    vehicle?: Vehicle
): { totalCBM: number; totalWeight: number, occupiedSpaces?: number } {
    const rawCBM = jobItems.reduce(
        (t, i) => t + (i.volume || 0),
        0
    );

    const totalWeight = jobItems.reduce(
        (t, i) => t + (i.quantity || 0) * (i.weight || 0),
        0
    );

    if (rawCBM <= 0) {
        return { totalCBM: 0, totalWeight: 0, occupiedSpaces: 0 };
    }

    let finalCBM = rawCBM;
    let palletSpaces = 0;
    // LCL / Air logic
    if (job_category_id == 1 || job_category_id == 2) {
        palletSpaces = calculatePalletSpacesOccupiedFromData(jobItems, vehicle);

        const palletCBM = palletSpaces * PALLET_CBM;
        finalCBM = Math.max(rawCBM, palletCBM);

        // weight → CBM
        if (companyWeight && totalWeight > 0) {
            const weightCBM = totalWeight / companyWeight;
            finalCBM = Math.max(finalCBM, weightCBM);
        }
    }

    return {
        totalCBM: finalCBM ? Number(finalCBM.toFixed(3)) : 0,
        totalWeight: totalWeight ? Number(totalWeight.toFixed(2)) : 0,
        occupiedSpaces: palletSpaces
    };
}