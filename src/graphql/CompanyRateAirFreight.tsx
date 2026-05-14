import { gql } from "@apollo/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AirFreightCompanyRate {
  id: string;
  company_id: string;
  seafreight_id?: string | null;
  state?: string | null;
  area?: string | null;
  min_weight?: number | null;
  max_weight?: number | null;
  cbm_rate?: number | null;
  minimum_charge?: number | null;
  per_km_rate?: number | null;
  per_kg_rate?: number | null;
  fuel_surcharge?: number | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AirFreightCompanyRateInput {
  company_id: string;
  seafreight_id?: string | null;
  state?: string | null;
  area?: string | null;
  min_weight?: number | null;
  max_weight?: number | null;
  cbm_rate?: number | null;
  minimum_charge?: number | null;
  per_km_rate?: number | null;
  per_kg_rate?: number | null;
  fuel_surcharge?: number | null;
  is_active?: boolean | null;
}

// ─── Fragment ─────────────────────────────────────────────────────────────────
// "on AirFreightCompanyRate" — backend GraphQL type name (schema la define பண்ணது)
// TypeScript interface name (AirFreightCompanyRate) வேற, GraphQL type name வேற

const AIR_FREIGHT_RATE_FIELDS = gql`
  fragment AirFreightRateFields on AirFreightCompanyRate {
    id
    company_id
    seafreight_id
    state
    area
    min_weight
    max_weight
    cbm_rate
    minimum_charge
    per_km_rate
    per_kg_rate
    fuel_surcharge
    is_active
    created_at
    updated_at
  }
`;

// ─── Queries ──────────────────────────────────────────────────────────────────

export const GET_AIR_FREIGHT_COMPANY_RATES = gql`
  ${AIR_FREIGHT_RATE_FIELDS}
  query GetAirFreightCompanyRates(
    $company_id: ID
    $is_active: Boolean
    $first: Int = 10
    $page: Int = 1
  ) {
    airFreightCompanyRates(
      company_id: $company_id
      is_active: $is_active
      first: $first
      page: $page
    ) {
      data {
        ...AirFreightRateFields
      }
      paginatorInfo {
        currentPage
        lastPage
        total
        hasMorePages
      }
    }
  }
`;

export const GET_ALL_AIR_FREIGHT_COMPANY_RATES = gql`
  ${AIR_FREIGHT_RATE_FIELDS}
  query GetAllAirFreightCompanyRates {
    allAirFreightCompanyRates {
      ...AirFreightRateFields
    }
  }
`;

export const GET_AIR_FREIGHT_COMPANY_RATE = gql`
  ${AIR_FREIGHT_RATE_FIELDS}
  query GetAirFreightCompanyRate($id: ID!) {
    airFreightCompanyRate(id: $id) {
      ...AirFreightRateFields
    }
  }
`;

export const GET_AIR_RATES_BY_COMPANY = gql`
  ${AIR_FREIGHT_RATE_FIELDS}
  query GetAirRatesByCompany($company_id: ID!) {
    getAirRatesByCompany(company_id: $company_id) {
      ...AirFreightRateFields
    }
  }
`;

// ─── Mutations ────────────────────────────────────────────────────────────────
// Input type: "AirFreightCompanyRateInput" — backend schema-ல define பண்ணது
// Mutation names: createAirFreightCompanyRate / updateAirFreightCompanyRate / deleteAirFreightCompanyRate

export const CREATE_AIR_FREIGHT_COMPANY_RATE = gql`
  ${AIR_FREIGHT_RATE_FIELDS}
  mutation CreateAirFreightCompanyRate($input: AirFreightCompanyRateInput!) {
    createAirFreightCompanyRate(input: $input) {
      ...AirFreightRateFields
    }
  }
`;

export const UPDATE_AIR_FREIGHT_COMPANY_RATE = gql`
  ${AIR_FREIGHT_RATE_FIELDS}
  mutation UpdateAirFreightCompanyRate($id: ID!, $input: AirFreightCompanyRateInput!) {
    updateAirFreightCompanyRate(id: $id, input: $input) {
      ...AirFreightRateFields
    }
  }
`;

export const DELETE_AIR_FREIGHT_COMPANY_RATE = gql`
  ${AIR_FREIGHT_RATE_FIELDS}
  mutation DeleteAirFreightCompanyRate($id: ID!) {
    deleteAirFreightCompanyRate(id: $id) {
      ...AirFreightRateFields
    }
  }
`;