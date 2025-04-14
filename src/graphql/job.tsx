import { gql } from "@apollo/client";

export const GET_JOBS_QUERY = gql`
  query jobs(
    $query: String
    $page: Int!
    $first: Int!
    $orderBy: [OrderByClause!]
    $orderByRelationship: [OrderByRelationshipInput!]
    $today: DateTime
    $driver_id: ID
    $customer_id: ID
    $company_id: ID
    $pickup_address: String
    $delivery_address: String
    $customer_name: String
    $pick_up_state: String
    $job_status_ids: [Int]
    $job_type_id: Int
    $has_customer_issue: Boolean
    $has_driver_issue: Boolean
    $has_report_issue: Boolean
    $states: [String]
    $suburbs: [String]
    $address_business_name: [String]
    $has_company_ids: [ID]
    $has_job_category_ids: [ID]
    $job_date_at: DateTime
    $job_status_id: [ID]
    $is_tailgate_required: Boolean
    $weight_from: Int
    $weight_to: Int
    $volume_from: Int
    $volume_to: Int
  ) {
    jobs(
      query: $query
      page: $page
      first: $first
      orderBy: $orderBy
      orderByRelationship: $orderByRelationship
      today: $today
      driver_id: $driver_id
      customer_id: $customer_id
      company_id: $company_id
      pickup_address: $pickup_address
      delivery_address: $delivery_address
      customer_name: $customer_name
      pick_up_state: $pick_up_state
      job_status_ids: $job_status_ids
      job_type_id: $job_type_id
      has_customer_issue: $has_customer_issue
      has_driver_issue: $has_driver_issue
      has_report_issue: $has_report_issue
      states: $states
      suburbs: $suburbs
      address_business_name: $address_business_name
      has_company_ids: $has_company_ids
      has_job_category_ids: $has_job_category_ids
      job_date_at: $job_date_at
      job_status_id: $job_status_id
      is_tailgate_required: $is_tailgate_required
      weight_from: $weight_from
      weight_to: $weight_to
      volume_from: $volume_from
      volume_to: $volume_to
      
    ) {
      data {
        id
        name
        total_quantity
        total_weight
        total_volume
        pick_up_lng
        pick_up_lat
        pick_up_address
        pick_up_notes
        pick_up_name
        pick_up_report
        delivery_name
        delivery_report
        driver_id
        driver {
          full_name
          no_max_capacity
          media_url
        }
        job_category_id
        job_category {
          name
        }
        job_status_id
        job_status {
          name
        }
        job_type_id
        job_type {
          name
        }
        customer_id
        customer {
          id
          full_name
        }
        company_id
        company {
          id
          name
        }
        ready_at
        drop_at
        start_at
        timeslot
        last_free_at
        pick_up_notes
        base_notes
        reference_no
        booked_by
        customer_notes
        decline_notes
        admin_notes
        is_inbound_connect
        is_hand_unloading
        is_dangerous_goods
        is_tailgate_required
        job_pickup_cities
        job_destination_cities
        job_destinations {
          id
          name
          label
          address
          address_business_name
          address_line_1
          address_line_2
          address_postal_code
          address_state
          address_country
          address_city
          is_pickup
          notes
          pick_up_name
          pick_up_notes
          estimated_at
          job_id
          lat
          lng
          job_destination_status_id
          route_point {
            id
            route_id
          }
          address_formatted
        }
        pick_up_destination {
          id
          name
          label
          address
          address_business_name
          address_line_1
          address_line_2
          address_postal_code
          address_state
          address_country
          address_city
          address_formatted
          is_pickup
          notes
          pick_up_name
          pick_up_notes
          estimated_at
          job_id
          lat
          lng
        }
        job_items {
          id
          item_type {
            name
          }
          dimension_height
          dimension_width
          dimension_depth
          quantity
          weight
          volume
        }
        created_at
        extras
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

export const GET_JOB_QUERY = gql`
  query job($id: ID!) {
    job(id: $id) {
      id
      name
      driver_id
      company_area
      driver {
        full_name
        no_max_capacity
      }
      job_category_id
      job_category {
        name
      }
      job_status_id
      job_status {
        name
      }
      job_type_id
      customer_id
      customer {
        id
        full_name
        phone_no
        email
      }
      company_id
      company {
        id
        name
      }
      admin_notes
      transport_location
      transport_type
      # delivery_notes
      pick_up_notes
      base_notes
      reference_no
      booked_by
      total_quantity
      total_weight
      total_volume
      customer_notes
      decline_notes
      minutes_waited
      pod_url
      invoice_url
      is_inbound_connect
      is_hand_unloading
      is_dangerous_goods
      is_tailgate_required
      ready_at
      drop_at
      start_at
      timeslot
      last_free_at
      job_cc_emails {
        id
        email
      }
      quote {
        id
        name
      }
      job_destinations {
        id
        name
        label
        address
        address_business_name
        address_line_1
        address_line_2
        address_postal_code
        address_state
        address_country
        address_city
        is_pickup
        pick_up_name
        pick_up_notes
        pick_up_condition
        estimated_at
        is_saved_address
        job_id
        lat
        lng
        notes
        job_destination_status_id
        updated_at
        issue_reports {
          id
          name
          notes
          job_id
          job_destination_id
          vehicle_hire_id
          issue_report_type_id
          issue_report_type {
            name
          }
          issue_report_status_id
          issue_report_status {
            name
          }
          sourceable {
            __typename
            ... on Driver {
              id
              full_name
            }
            ... on Customer {
              id
              full_name
            }
          }
          sourceable_type
          sourceable_id
          updated_at
        }
        media {
          id
          name
          downloadable_url
          collection_name
        }
        route_point {
          id
          route_id
        }
      }
      pick_up_destination {
        id
        name
        label
        address
        address_business_name
        address_line_1
        address_line_2
        address_postal_code
        address_state
        address_country
        address_city
        is_pickup
        job_destination_status_id
        pick_up_name
        pick_up_notes
        pick_up_condition
        is_saved_address
        estimated_at
        job_id
        lat
        lng
        notes
        updated_at
      }
      job_items {
        id
        name
        quantity
        weight
        dimension_height
        dimension_width
        dimension_depth
        volume
        item_type_id
        item_type {
          name
        }
      }
      media {
        id
        name
        downloadable_url
        collection_name
        file_name
        uploaded_by
        created_at
      }
      chats {
        id
        name
        chat_messages {
          id
          message
          media_url
          created_at
          user {
            driver {
              id
              full_name
              first_name
              last_name
            }
            customer {
              id
              full_name
              first_name
              last_name
            }
          }
        }
      }
      customer_invoice {
        id
        name
        period
        job_id
        vehicle_hire_id
        driver_id
        customer_id
        customer {
          id
          full_name
          first_name
          last_name
          company {
            id
            name
          }
        }
        company_id
        invoice_status_id
        is_rcti
        issued_at
        due_at
        paid_at
        line_amount_types
        currency
        sub_total
        total_tax
        total
        amount_due
        amount_paid
        xero_invoice_id
        xero_updated_at
        invoice_line_items {
          name
          invoice_id
          is_rate
          is_surcharge
          tax_type
          quantity
          unit_amount
          tax_amount
          line_amount
          xero_line_item_id
        }
      }
      quoted_price
      created_at
    }
  }
`;

export const CREATE_JOB_MUTATION = gql`
  mutation createJob($input: CreateJobInput!) {
    createJob(input: $input) {
      id
      name
    }
  }
`;

export const UPDATE_JOB_RIGHT_MUTATION = gql`
  mutation updateJob($input: UpdateJobInput!) {
    updateJob(input: $input) {
      id
      driver_id
      job_type_id
      job_status_id
      job_category_id
      start_at
      admin_notes
      company_area
    }
  }
`;

export const UPDATE_JOB_MUTATION = gql`
  mutation updateJob($input: UpdateJobInput!) {
    updateJob(input: $input) {
      id
      name
      reference_no
      booked_by
      notes
      job_category_id
      job_status_id
      job_type_id
      decline_reason_id
      driver_id
      region_id
      customer_id
      company_id
      start_at
      ready_at
      drop_at
      completed_at
      pick_up_lng
      pick_up_lat
      pick_up_address
      pick_up_state
      pick_up_notes
      pick_up_name
      pick_up_report
      delivery_name
      delivery_report
      customer_notes
      base_notes
      admin_notes
      decline_notes
      minutes_waited
      is_inbound_connect
      is_hand_unloading
      is_dangerous_goods
      is_tailgate_required
      timeslot
      last_free_at
      quoted_price
      transport_type
      transport_location
      company_area
    }
  }
`;


export const BULK_UPDATE_JOB_MUTATION = gql`
  mutation bulkUpdateJob($input: [UpdateJobInput]!) {
    bulkUpdateJob(input: $input) {
      id
      name
      driver_id
      start_at
    }
  }
`;

export const DELETE_JOB_MUTATION = gql`
  mutation deleteJob($id: ID!) {
    deleteJob(id: $id) {
      id
    }
  }
`;

export const SEND_CONSIGNMENT_DOCKET = gql`
  mutation sendConsignmentDocket($id: ID!) {
    sendConsignmentDocket(id: $id) {
      id
    }
  }
`;

export interface UpdateJobInput {
  id: number; 
  name?: string;
  driver_id?: number;
  job_type_id?: number;
  job_status_id?: number;
  job_category_id?: number;
  start_at?: Date;
  admin_notes?: string;
  booked_by?: string;
  company_area:string;
  reference_no?: string;
  customer_id?: string;
  company_id?: number;
  transport_type?: string;
  transport_location?: string;
  ready_at?: string;
  drop_at?: string;
  pick_up_lng?: number;
  pick_up_lat?: number;
  pick_up_address?: string;
  pick_up_notes?: string;
  pick_up_name?: string | null;
  timeslot?: string;
  last_free_at?: string;
  quoted_price?: string;
  customer_notes?: string;
  base_notes?: string;
  // job_price_quote: any;
}

export interface CreateJobInput {
  name?: string;
  reference_no?: string;
  booked_by?: string;
  job_category_id?: number;
  job_status_id?: number;
  job_type_id?: number;
  customer_id?: string;
  company_id?: number;
  company_area:string;
  transport_type?: string; // Fixed from transportType
  transport_location?: string;
  ready_at?: string;
  drop_at?: string;
  pick_up_lng?: number;
  pick_up_lat?: number;
  pick_up_address?: string;
  pick_up_notes?: string;
  pick_up_name?: string | null;
  timeslot?: string;
  last_free_at?: string;
  quoted_price?: string;
  admin_notes?: string;
  customer_notes?: string;
  base_notes?: string;
  // job_price_quote?: JobPriceCalculationDetail[]; 
}

type Job = {
  id: number | null;
  //name: string;
  reference_no: string;
  booked_by: string;
  //notes: string;
  job_category_id: number;
  // job_category_name?: string;
  job_status_id: number;
  job_type_id: number;
  company_area:string;
  //decline_reason_id: number;
  //driver_id: number;
  //region_id: number;
  customer_id: number;
  company_id: number;
  //start_at: string;
  //ready_at: string;
  //drop_at: string;
  //completed_at: string;
  //pick_up_lng: number;
  //pick_up_lat: number;
  //pick_up_address: string;
  //pick_up_notes: string;
  //pick_up_name: string;
  //pick_up_report: string;
  //delivery_name: string;
  //delivery_report: string;
  //customer_notes: string;
  //base_notes: string;
  //admin_notes: string;
  //decline_notes: string;
  //minutes_waited: number;
  //is_inbound_connect: boolean;
  //is_hand_unloading: boolean;
  //is_dangerous_goods: boolean;
  //is_tailgate_required: boolean;
  transport_type: string;
  transport_location: string;
  // job_price_quote?: JobPriceCalculationDetail[];
  media: any[] | null;
  [key: string]:
    | string
    | number
    | null
    | boolean
    | undefined
    | Date
    | any[]
    | any;
};


export const defaultJob: Job = {
  id: null,
  name: "",
  reference_no: "",
  booked_by: "",
  //notes: "",
  job_category_id: 1,
  company_area:"",
  // job_category_name: undefined,
  job_status_id: null,
  job_type_id: 1,
  //decline_reason_id: 0,
  //driver_id: 0,
  //region_id: 0,
  customer_id: null,
  company_id: null,
  //start_at: "",
  //ready_at: "",
  //drop_at: "",
  //pick_up_lng: 0,
  //pick_up_lat: 0,
  //pick_up_address: "",
  //pick_up_notes: "",
  //pick_up_name: "",
  //pick_up_report: "",
  //delivery_name: "",
  //delivery_report: "",
  //customer_notes: "",
  //base_notes: "",
  //admin_notes: "",
  //decline_notes: "",
  //minutes_waited: 0,
  //is_inbound_connect: false,
  //is_hand_unloading: false,
  //is_dangerous_goods: false,
  //is_tailgate_required: false,
  media: [],
  transport_type: "",
  transport_location: "",
  // job_price_quote: []
};

export type JobAddress = {
  state: string;
  suburb: string;
  postcode: string;
  address: string;
};

export type PickupTime = {
  ready_by: string; // ISO date string
};

export type DeliveryTime = {
  drop_by: string; // ISO date string
};

export type Surcharges = {
  hand_unload: boolean;
  dangerous_goods: boolean;
  time_slot: string | null;
  tail_lift: string | null;
  stackable: string | null;
};

export type ItemType = {
  id: string;
  name: string;
};

export type JobItem = {
  id: string;
  name: string;
  notes: string;
  quantity: number;
  volume: number;
  weight: number;
  dimension_height: number;
  dimension_width: number;
  dimension_depth: number;
  job_destination: string | null;
  item_type: ItemType;

};

export type JobQuoteData = {
  freight_type: string;
  transport_type: any;
  service_choice: string;
  state: string;
  state_code: string;
  stackable: boolean;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  job_pickup_address: JobAddress;
  job_destination_address: JobAddress;
  pickup_time: PickupTime;
  delivery_time: DeliveryTime;
  surcharges: Surcharges;
  job_items: JobItem[];
  cbm_rate: number;
  minimum_charge: number;
  area: string;
};

const defaultJobQuoteData: JobQuoteData = {
  freight_type: "",
  transport_type: "",
  service_choice:'',
  state: "",
  state_code: "",
  created_at: "",
  updated_at: "",
  stackable: false,
  cbm_rate: 0,
  minimum_charge: 0,
  area: '',
  job_pickup_address: {
    state: "",
    suburb: "",
    postcode: "",
    address: "",
  },
  job_destination_address: {
    state: "",
    suburb: "",
    postcode: "",
    address: "",
  },
  pickup_time: {
    ready_by: "",
  },
  delivery_time: {
    drop_by: "",
  },
  surcharges: {
    hand_unload: false,
    dangerous_goods: false,
    time_slot: null,
    tail_lift: null,
    stackable: null,
  },
  job_items: [],
};

export default defaultJobQuoteData;