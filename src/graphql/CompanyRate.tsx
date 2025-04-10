import { gql } from "@apollo/client";

export interface CompanyRate {
  id: string;
  company_id: string;
  area: string;
  cbm_rate: number;
  minimum_charge: number;
  created_at: string;
  updated_at: string;
}

export const CREATE_COMPANY_RATE_MUTATION = gql`
  mutation CreateCompanyRate(
    $company_id: ID!
    $area: String!
    $cbm_rate: Float!
    $minimum_charge: Float!
  ) {
    createCompanyRate(
      input: {
        company_id: $company_id
        area: $area
        cbm_rate: $cbm_rate
        minimum_charge: $minimum_charge
      }
    ) {
      id
      company_id
      area
      cbm_rate
      minimum_charge
      created_at
      updated_at
    }
  }
`;

export const GET_COMPANY_RATE_QUERY = gql`
  query GetRatesByCompany($company_id: ID!) {
    getRatesByCompany(company_id: $company_id) {
      id
      company_id
      area
      cbm_rate
      minimum_charge
      created_at
      updated_at
    }
  }
`;

export const UPDATE_COMPANY_RATE_MUTATION = gql`
  mutation UpdateCompanyRate(
    $id: ID!
    $company_id: ID!
    $area: String!
    $cbm_rate: Float!
    $minimum_charge: Float!
  ) {
    updateCompanyRate(
      id: $id
      input: {
        company_id: $company_id
        area: $area
        cbm_rate: $cbm_rate
        minimum_charge: $minimum_charge
      }
    ) {
      id
      company_id
      area
      cbm_rate
      minimum_charge
      created_at
      updated_at
    }
  }
`;