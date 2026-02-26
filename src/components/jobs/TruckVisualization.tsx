// src/components/TruckVisualization.tsx

"use client";

import {
    Box,
    Divider,
    Heading,
    HStack,
    Spinner,
    Text,
    VStack,
} from "@chakra-ui/react";
import { useMemo } from "react";

import { Box as BoxType, Vehicle } from "../../types/truck";
import { calculatePalletSpacesWithDetails } from "../../utils/truckCalculations";
import { useTruckCanvas } from "../../utils/useTruckCanvas";

interface Props {
    vehicle: Vehicle | null;
    boxes: BoxType[];
    isLoading?: boolean;
}

export default function TruckVisualization({ vehicle, boxes, isLoading = false }: Props) {
    // Calculate placements
    const calculationResult = useMemo(() => {
        if (!vehicle || boxes.length === 0) {
            return {
                placements: [],
                occupiedSpaces: [],
                spaceDetails: {},
                spaceCount: 0
            };
        }
        return calculatePalletSpacesWithDetails(boxes, vehicle);
    }, [vehicle, boxes]);

    // Use canvas hook
    const canvasRef = useTruckCanvas(vehicle, calculationResult.placements);


    if (isLoading) {
        return (
            <Box p={4} borderWidth="1px" borderRadius="md" textAlign="center">
                <Spinner size="lg" color="blue.500" />
                <Text mt={4} color="gray.600">Loading truck visualization...</Text>
            </Box>
        );
    }

    if (!vehicle) {
        return (
            <Box p={4} borderWidth="1px" borderRadius="md">
                <Text color="gray.500">No vehicle selected. Add items to see truck layout.</Text>
            </Box>
        );
    }

    return (
        <Box
            p={5}
            borderWidth="1px"
            borderRadius="lg"
            bg="white"
            width="100%"
        >
            <VStack align="start" spacing={4}>
                <Heading size="md">🚛 Truck Layout – Box Placement View</Heading>

                <Box
                    borderWidth="1px"
                    borderRadius="md"
                    overflow="auto"
                    bg="gray.50"
                    p={3}
                    maxW="100%"
                >
                    <canvas
                        ref={canvasRef}
                        style={{
                            maxWidth: '60%',
                            height: 'auto',
                            display: 'block'
                        }}
                    />
                </Box>

                <Text fontSize="sm" color="gray.600">
                    {vehicle.truck_length_cm}cm (Length) ×{" "}
                    {vehicle.truck_width_cm}cm (Width) –{" "}
                    <strong>{vehicle.vehicle_name}</strong>
                </Text>

                <Box>
                    <Text fontSize="sm" fontWeight="600" color="blue.600">
                        Pallet Spaces Used: {calculationResult.spaceCount}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                        Boxes Placed: {calculationResult.placements.length} / {boxes.length}
                    </Text>
                    {calculationResult.placements.length < boxes.length && (
                        <Text fontSize="sm" color="red.500" mt={1}>
                            ⚠️ Warning: {boxes.length - calculationResult.placements.length} box(es) could not fit!
                        </Text>
                    )}
                </Box>

                <Divider />

                <HStack spacing={6}>
                    <HStack>
                        <Box w="16px" h="16px" bg="#667eea" borderRadius="sm" />
                        <Text fontSize="sm">Occupied Space</Text>
                    </HStack>

                    <HStack>
                        <Box
                            w="16px"
                            h="16px"
                            bg="white"
                            border="2px solid"
                            borderColor="gray.300"
                            borderRadius="sm"
                        />
                        <Text fontSize="sm">Empty Space</Text>
                    </HStack>
                </HStack>
            </VStack>
        </Box>
    );
}