import { gql } from "@apollo/client";

export const GET_VENDORS_QUERY = gql`
  query vendors(
    $query: String
    $page: Int!
    $first: Int!
    $orderByColumn: String!
    $orderByOrder: SortOrder!
  ) {
    vendors(
      query: $query
      page: $page
      first: $first
      orderBy: { column: $orderByColumn, order: $orderByOrder }
    ) {
      data {
        id
        name
      }
      paginatorInfo {
        count
        currentPage
        firstItem
        hasMorePages
        lastItem
        lastPage
        perPage
        total
      }
    }
  }
`;

export const GET_VENDOR_QUERY = gql`
  query company($id: ID!) {
    company(id: $id) {
      id
      name
      abn
      contact_phone
      contact_email
      account_email
      is_pod_sendable
      is_invoice_sendable
      admin_notes
      base_notes
      lcl_rate
      address
      address_business_name
      address_line_1
      address_line_2
      address_postal_code
      address_city
      address_state
      address_country
      rate_card_url
      logo_url
      payment_term
    }
  }
`;

export const CREATE_VENDOR_MUTATION = gql`
  mutation createCompany($input: CreateCompanyInput!) {
    createCompany(input: $input) {
      id
      name
      abn
      contact_phone
      contact_email
      integration_email
      account_email
      admin_notes
      base_notes
      payment_term
    }
  }
`;

export const UPDATE_VENDOR_MUTATION = gql`
  mutation updateCompany($input: UpdateCompanyInput!) {
    updateCompany(input: $input) {
      id
      name
      abn
      contact_phone
      contact_email
      integration_email
      account_email
      admin_notes
      base_notes
      is_pod_sendable
      is_invoice_sendable
      payment_term
    }
  }
`;

export const DELETE_VENDOR_MUTATION = gql`
  mutation deleteCompany($id: ID!) {
    deleteCompany(id: $id) {
      id
    }
  }
`;

export interface UpdateCompanyInput {
  id: Number;
  name: String;
  abn: String;
  contact_phone: String;
  contact_email: String;
  account_email: String;
  is_pod_sendable: Boolean;
  is_invoice_sendable: Boolean;
  admin_notes: String;
  base_notes: String;
  lcl_rate: Number;
  address: String;
  address_business_name: String;
  address_line_1: String;
  address_line_2: String;
  address_postal_code: String;
  address_city: String;
  address_state: String;
  address_country: String;
  lng: Number;
  lat: Number;
  payment_term: String;
}

export interface CreateCompanyInput {
  name: String;
  abn: String;
  contact_phone: String;
  contact_email: String;
  account_email: String;
  integration_email: String;
  is_pod_sendable: Boolean;
  is_invoice_sendable: Boolean;
  admin_notes: String;
  base_notes: String;
  lcl_rate: Number;
  address: String;
  address_business_name: String;
  address_line_1: String;
  address_line_2: String;
  address_postal_code: String;
  address_city: String;
  address_state: String;
  address_country: String;
  lng: Number;
  lat: Number;
  payment_term: String;
}

type Company = {
  id: number | null;
  name: string | null;
  abn: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  integration_email: string | null;
  account_email: string | null;
  is_pod_sendable: boolean | null;
  is_invoice_sendable: boolean | null;
  admin_notes: string | null;
  base_notes: string | null;
  lcl_rate: number | null;
  address: string | null;
  address_business_name: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  address_postal_code: string | null;
  address_city: string | null;
  address_state: string | null;
  address_country: string | null;
  lng: number | null;
  lat: number | null;
  rate_card_url: string | null;
  logo_url: string | null;
  payment_term: String | null;
};

export const defaultCompany: Company = {
  id: null,
  name: "",
  lcl_rate: 17,
  is_pod_sendable: true,
  is_invoice_sendable: true,
  abn: "",
  contact_phone: "",
  contact_email: "",
  integration_email: "",
  account_email: "",
  admin_notes: "",
  base_notes: "",
  address: "",
  address_business_name: "",
  address_line_1: "",
  address_line_2: "",
  address_postal_code: "",
  address_city: "",
  address_state: "",
  address_country: "",
  lng: null,
  lat: null,
  rate_card_url: null,
  logo_url: null,
  payment_term: '7_days',
};

export const paymentTerms = [
  { label: "EOD", value: "EOD" },
  { label: "7 Days", value: "7_days" },
  { label: "14 Days", value: "14_days" },
  { label: "30 Days", value: "30_days" },
  { label: "7 Days EOM", value: "7_days_eom" },
  { label: "14 Days EOM", value: "14_days_eom" },
  { label: "21 Days EOM", value: "21_days_eom" },
  { label: "30 Days EOM", value: "30_days_eom" },
];
