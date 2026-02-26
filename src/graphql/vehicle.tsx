// src/graphql/vehicle.ts

import { gql } from '@apollo/client';

export const FIND_SUITABLE_VEHICLE = gql`
  query FindSuitableVehicle($input: FindSuitableVehicleInput!) {
    findSuitableVehicle(input: $input) {
      vehicle {
        id
        vehicle_name
        vehicle_code
        truck_length_cm
        truck_width_cm
        max_pallets
        vehicle_category
        max_length_m
        max_width_m
        max_height_m
        max_weight_kg
        max_cbm
      }
      needs_semi
      needs_bdouble
      needs_flatbed
    }
  }
`;