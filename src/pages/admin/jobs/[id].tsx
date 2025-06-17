// Chakra imports
import { useMutation, useQuery } from "@apollo/client";
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Radio,
  RadioGroup,
  SimpleGrid,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { faTrashCan } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import AreYouSureAlert from "components/alert/AreYouSureAlert";
import ColorSelect from "components/fields/ColorSelect";
import CustomInputField from "components/fields/CustomInputField";
// import CustomInputFieldAdornment from "components/fields/CustomInputFieldAdornment";
import FileInput from "components/fileInput/FileInput";
import InvoiceTab from "components/jobs/InvoiceTab";
import JobAddressesSection from "components/jobs/JobAddressesSection";
import JobInputTable from "components/jobs/JobInputTable";
import MessageLogTab from "components/jobs/MessageLogTab";
import ReportsTab from "components/jobs/ReportsTab";
import PaginationTable from "components/table/PaginationTable";
import { TabsComponent } from "components/tabs/TabsComponet";
import TagsInput from "components/tagsInput";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import { GET_COMPANY_QUERY, GET_COMPANYS_QUERY } from "graphql/company";
import { GET_COMPANY_RATE_QUERY } from "graphql/CompanyRate";
import { defaultCustomer, GET_CUSTOMERS_QUERY } from "graphql/customer";
import { GET_CUSTOMER_ADDRESSES_QUERY } from "graphql/customerAddress";
import { GET_DRIVERS_QUERY } from "graphql/driver";
import { GET_ITEM_TYPES_QUERY } from "graphql/itemType";
import defaultJobQuoteData, {
  defaultJob,
  DELETE_JOB_MUTATION,
  GET_ALL_TIMESLOT_DEPOTS,
  GET_JOB_QUERY,
  UPDATE_JOB_MUTATION} from "graphql/job";
import { GET_JOB_CATEGORIES_QUERY } from "graphql/jobCategories";
import {
  CREATE_JOB_CC_EMAIL_MUTATION,
  DELETE_JOB_CC_EMAIL_MUTATION,
} from "graphql/jobCcEmails";
import {
  CREATE_JOB_DESTINATION_MUTATION,
  defaultJobDestination,
  DELETE_JOB_DESTINATION_MUTATION,
  UPDATE_JOB_DESTINATION_MUTATION,
} from "graphql/jobDestination";
import {
  CREATE_JOB_ITEM_MUTATION,
  defaultJobItem,
  DELETE_JOB_ITEM_MUTATION,
  UPDATE_JOB_ITEM_MUTATION,
} from "graphql/jobItem";
import {
  CREATE_JOB_PRICE_CALCULATION_DETAIL_MUTATION,
  CreateJobPriceCalculationDetailInput,
  defaultJobPriceCalculationDetail,
  GET_JOB_PRICE_CALCULATION_DETAIL_QUERY,
  UPDATE_JOB_PRICE_CALCULATION_DETAIL_MUTATION,
  // UpdateJobPriceCalculationDetailInput,
} from "graphql/JobPriceCalculationDetail";
import { GET_JOB_STATUSES_QUERY } from "graphql/jobStatus";
import { GET_JOB_TYPES_QUERY } from "graphql/jobType";
import { DELETE_MEDIA_MUTATION } from "graphql/media";
import {
  formatDate,
  formatDateTimeToDB,
  formatTime,
  formatTimeUTCtoInput,
  // getTimezone,
  // isAfterCutoff,
  today,
} from "helpers/helper";
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
import { useRouter } from "next/router";
import {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

interface CalculationData {
  cbm_auto: number;
  total_weight: number;
  freight: number;
  fuel: number;
  hand_unload: number;
  dangerous_goods: number;
  time_slot: number;
  tail_lift: number;
  stackable: number;
  total: number;
}

function JobEdit() {
  const toast = useToast();
  // const textColor = useColorModeValue("navy.700", "white");
  const textColorSecodary = useColorModeValue("#888888", "#888888");
  const [job, setJob] = useState(defaultJob);
  const [refinedData, setRefinedData] = useState(defaultJobQuoteData);
  const [quoteCalculationRes, setQuoteCalculationRes] = useState(
    defaultJobPriceCalculationDetail,
  );
  // const [changedFields, setChangedFields] =
  //   useState<typeof defaultJob>(defaultJob);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [_pricecalculationid, setPricecalculationid] = useState(null);
  const [buttonText, setButtonText] = useState("Get A Quote");
  const router = useRouter();
  const { id } = router.query;
  const [isSaving, setIsSaving] = useState(false);
  const [updatingMedia, setUpdatingMedia] = useState(false);
  const [tabId, setActiveTab] = useState(1);
  const [jobItems, setJobItems] = useState([defaultJobItem]);
  const [originalJobItems, setOriginalJobItems] = useState([]); // used to delete items if are not contained in the new jobItems array
  const [customerSelected, setCustomerSelected] = useState(defaultCustomer);
  const [jobTypeOptions, setJobTypeOptions] = useState([]);
  const [jobCategories, setJobCategories] = useState([]);
  const [jobStatuses, setJobStatuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [companiesOptions, setCompaniesOptions] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [savedAddressesSelect, setSavedAddressesSelect] = useState([]);
  const [jobDateAt, setJobDateAt] = useState(today);
  const [readyAt, setReadyAt] = useState("06:00");
  const [dropAt, setDropAt] = useState("17:00");
  const [originalJobDestinations, setOriginalJobDestinations] = useState([]);
  const [jobDestinations, setJobDestinations] = useState([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedSearchDriver, setDebouncedSearchDriver] = useState("");

  const re = useMemo(() => {
    return /^(([^<>()$$\\.,;:\s@"]+(\.[^<>()$$\\.,;:\s@"]+)*)|(".+"))@(($[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  }, []);

  const [deleteJobCcEmailId, setDeleteJobCcEmailId] = useState(null);
  const [createdCcEmail, setCreatedCcEmail] = useState(null);
  const [jobCcEmails, setJobCcEmails] = useState([]);
  const [jobCcEmailTags, setJobCcEmailTags] = useState([]);
  const isAdmin = useSelector((state: RootState) => state.user.isAdmin);
  // const customerId = useSelector((state: RootState) => state.user.customerId);
  // const companyId = useSelector((state: RootState) => state.user.companyId);
  const isCompany = useSelector((state: RootState) => state.user.isCompany);
  const isCustomer = useSelector((state: RootState) => state.user.isCustomer);
  const [pickUpDestination, setPickUpDestination] = useState(
    defaultJobDestination,
  );
  const [_isSameDayJob, setIsSameDayJob] = useState(false);
  const [_isTomorrowJob, setIsTomorrowJob] = useState(false);
  // const [filteredJobTypeOptions, setFilteredJobTypeOptions] = useState([]);
  const [locationOptions, _setLocationOptions] = useState([
    { value: "VIC", label: "Victoria" },
    { value: "QLD", label: "Queensland" },
  ]);

  const [depotOptions, setDepotOptions] = useState([]);
  const [filtereddepotOptions, setFilteredDepotOptions] = useState([]);


  const [_selectedDepot, setSelectedDepot] = useState("");

  const [prevJobState, setPrevJobState] = useState({
    freight_type: refinedData.freight_type,
    transport_type: job.transport_type,
    transport_location: job.transport_location,
    job_items: jobItems, // Add job_items to the state
  });

  const [companyRates, setCompanyRates] = useState([]);

  const [_selectedRegion, setSelectedRegion] = useState({
    area: "",
    cbm_rate: 0,
    minimum_charge: 0,
  });

  const tabs = [
    {
      id: 1,
      tabName: "Job Details",
      hash: "job_details",
      isVisible: true,
    },
    {
      id: 2,
      tabName: "Reports",
      hash: "reports",
      isVisible: true,
    },
    {
      id: 3,
      tabName: "Message Log",
      hash: "message_log",
      isVisible: isAdmin,
    },
    {
      id: 4,
      tabName: "Invoice",
      hash: "invoice",
      isVisible:
        isAdmin ||
        !(
          isCustomer &&
          (job.customer_invoice == undefined ||
            job.customer_invoice?.invoice_status_id == 1)
        ),
    },
  ];

  // const NEW_CUTOFF_RULES_START_DATE = "2024-10-24";

  const itemsTableColumns = useMemo(
    () => [
      {
        Header: "Type",
      },
      {
        Header: "DIMENSIONS (L,W,H)",
      },
      {
        Header: "QTY",
      },
      {
        Header: "WEIGHT",
      },
      {
        Header: "CBM",
      },
      {
        Header: "ACTION",
      },
    ],
    [],
  );

  const attachmentColumns = useMemo(
    () => [
      {
        Header: "Document",
        accessor: "name" as const,
      },
      {
        Header: "uploaded by",
        accessor: "uploaded_by" as const,
      },
      {
        Header: "date uploaded",
        accessor: "created_at" as const,
        type: "date",
      },
      {
        Header: "Actions",
        accessor: "downloadable_url" as const,
        isDelete: isAdmin,
        isEdit: false,
        isDownload: true,
      },
    ],
    [isAdmin],
  );

  const onChangeSearchQuery = useMemo(() => {
    return debounce((e) => {
      setDebouncedSearch(e);
    }, 300);
  }, []);

  const onChangeCustomerSearchQuery = useMemo(() => {
    return debounce((e) => {
      setDebouncedSearchDriver(e);
    }, 300);
  }, []);

  const { data: _depotData } = useQuery(GET_ALL_TIMESLOT_DEPOTS, {
    onCompleted: (data) => {
      if (data?.allTimeslotDepots) {
        const depots = data.allTimeslotDepots
          .filter((depot: any) => depot.is_active)
          .map((depot: any) => ({
            value: depot.depot_name,
            label: depot.depot_name,
            price: depot.depot_price,
            state_code: depot.state_code,
            pincode: depot.pincode
          }));
        setDepotOptions(depots);
        console.log("depots", depots)

      }
    },
    onError: (error) => {
      console.error("Error fetching depots:", error);
      toast({
        title: "Error fetching depots",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  });

  const {
    loading: jobLoading,
    data: jobData, // Renamed 'data' to 'jobData'
    refetch: getJob,
  } = useQuery(GET_JOB_QUERY, {
    variables: {
      id: id,
    },
    skip: !id,
    onCompleted: (data) => {
      if (data?.job == null) {
        router.push("/admin/jobs");
      }

      if (!updatingMedia) {
        setJob({
          ...job,
          ...data?.job,
          company_id: data?.job.company_id,
          media: data?.job.media,
          job_category_id: data?.job.job_category_id,
          transport_location: data?.job.transport_location,
          company_area: data?.job.company_area,
          job_type_id: data?.job.job_type_id,
          pick_up_state: data?.job.pick_up_state,
        });
        if (data?.job.company_area && companyRates.length > 0) {
          const matchingRate = companyRates.find(
            (rate) => rate.area === data.job.company_area,
          );
          if (matchingRate) {
            setSelectedRegion({
              area: matchingRate.area,
              cbm_rate: matchingRate.cbm_rate,
              minimum_charge: matchingRate.minimum_charge,
            });
          }
        }
        getCompanyRates({ variables: { company_id: data.job.company_id } }); // Fetch company rates here

        const selectedCategoryName = jobCategories.find(
          (job_category) => job_category.value == data?.job.job_category_id,
        )?.label;
        const selectedStateCode = data.job.pick_up_state == 'Victoria' ? 'VIC' : 
        data.job.pick_up_state == 'Queensland' ? 'QLD' : '';        
        const selectedLocation = locationOptions.find(
          (location) => location.label == data.job.pick_up_state,
        );
        setRefinedData({
          ...refinedData,
          freight_type: selectedCategoryName || null,
          state_code: selectedLocation?.value || null,
          state: selectedLocation?.label || null,
        });
        const filtereddepotOption =
        depotOptions.filter(
          (option) => option.state_code ==  selectedStateCode
        );
      console.log(
        filtereddepotOption, selectedStateCode,
        "filtereddepotOption",
      );
      setFilteredDepotOptions(filtereddepotOption);
        getCustomersByCompanyId({
          query: "",
          page: 1,
          first: 1000,
          orderByColumn: "id",
          orderByOrder: "ASC",
          company_id: data.job.company_id,
        });

        setJobDateAt(
          data.job.ready_at ? formatDate(data.job.ready_at) : jobDateAt,
        );
        setReadyAt(
          data.job.ready_at ? formatTimeUTCtoInput(data.job.ready_at) : readyAt,
        );
        setDropAt(
          data.job.drop_at ? formatTimeUTCtoInput(data.job.drop_at) : dropAt,
        );
        setIsSameDayJob(today === formatDate(data.job.ready_at));
        setIsTomorrowJob(
          new Date(formatDate(data.job.ready_at)).toDateString() ===
            new Date(
              new Date(today).setDate(new Date(today).getDate() + 1),
            ).toDateString(),
        );
        // jobDestinations without is_pickup
        // let _jobDestinations = data.job.job_destinations || [];
        let _jobDestinations =
          data.job.job_destinations.filter(
            (destination: any) => !destination.is_pickup,
          ) || [];

          let currentDestinations =
          data.job.job_destinations.filter(
            (destination: any) => !destination.is_pickup,
          ) || [];
          console.log("currentDestinations", currentDestinations.address_state);
          // console.log("jobDestinations", jobDestinations);
        setOriginalJobDestinations(_jobDestinations);
        setJobDestinations(_jobDestinations);

        setPickUpDestination(
          data.job.pick_up_destination
            ? data.job.pick_up_destination
            : { ...defaultJobDestination, id: 0, is_new: true },
        );

        setOriginalJobItems([]);
        setOriginalJobItems(data.job.job_items);
        setJobItems([]);
        setJobItems(data.job.job_items);
        setJobCcEmails([]);
        setJobCcEmails(data.job.job_cc_emails);
        setJobCcEmailTags(
          data.job.job_cc_emails.map(
            (job_cc_email: { id: number; email: string }) => job_cc_email.email,
          ),
        );
      } else {
        setJob({ ...job, media: data?.job.media });
        setJobCcEmails(data.job.job_cc_emails);
        setUpdatingMedia(false);
      }
    },
    // onError(error) {
      // console.log("onError");
      // console.log(error);
    // },
  });

  useEffect(() => {
    if (job.company_area && companyRates.length > 0) {
      const matchingRate = companyRates.find(
        (rate) => rate.area === job.company_area,
      );
      if (matchingRate) {
        setSelectedRegion({
          area: matchingRate.area,
          cbm_rate: matchingRate.cbm_rate,
          minimum_charge: matchingRate.minimum_charge,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyRates, job.company_area]);

  const { loading: _companyLoading, data: _companyData } = useQuery(
    GET_COMPANY_QUERY,
    {
      variables: {
        id: job?.company_id,
      },
      skip: !job?.company_id,
      onCompleted: (data) => {
        if (data?.company == null) {
          // router.push("/admin/companies");
        }
        setRefinedData({
          ...refinedData,
        });
      },
      // onError(error) {
        // console.log("onError");
        // console.log(error);
      // },
    },
  );

  useEffect(() => {
    if (jobData?.job) {
      // Use 'jobData' instead of 'data'
      setJob({
        ...job,
        job_category_id: jobData.job.job_category_id,
        transport_location: jobData.job.transport_location,
        job_type_id: jobData.job.job_type_id,
      });

      // Find the selected category name based on job_category_id
      const selectedCategoryName = jobCategories.find(
        (job_category) => job_category.value === jobData.job.job_category_id,
      )?.label;

      const selectedLocation = locationOptions.find(
        (location) => location.value === jobData.job.transport_location,
      );

      const _matchedJobType = jobTypeOptions.find(
        (type) => type.id === jobData.job.job_type_id,
      );

      setRefinedData({
        ...refinedData,
        freight_type: selectedCategoryName,
        state_code: jobData.job.transport_location,
        state: selectedLocation?.label || null,
        // job_type: matchedJobType?.name || null,
        // job_type_color: matchedJobType?.color || null
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobData, jobCategories, jobTypeOptions, companyRates]); // Use 'jobData' instead of 'data'

  const formatToSelect = (
    _entityArray: any[],
    valueKeyName: string,
    labelKeyName: string,
  ) => {
    return _entityArray.map((_entityItem) => {
      return {
        value: _entityItem[valueKeyName],
        label: _entityItem[labelKeyName],
        entity: _entityItem,
      };
    });
  };

  const [handleUpdateJob, {}] = useMutation(UPDATE_JOB_MUTATION, {
    variables: {
      input: {
        id: job.id,
        name: job.name,
        reference_no: job.reference_no,
        booked_by: job.booked_by,
        company_area: job.company_area,
        notes: job.notes,
        job_category_id: job.job_category_id,
        job_status_id: job.job_status_id,
        job_type_id: job.job_type_id,
        decline_reason_id: job.decline_reason_id,
        driver_id: job.driver_id,
        region_id: job.region_id,
        customer_id: job.customer_id,
        company_id: job.company_id,
        start_at: job.start_at,
        ready_at: job.ready_at,
        drop_at: job.drop_at,
        completed_at: job.completed_at,
        pick_up_lng: job.pick_up_lng,
        pick_up_lat: job.pick_up_lat,
        pick_up_address: job.pick_up_address,
        pick_up_state: job.pick_up_state,
        pick_up_notes: job.pick_up_notes,
        pick_up_name: job.pick_up_name,
        pick_up_report: job.pick_up_report,
        delivery_name: job.delivery_name,
        delivery_report: job.delivery_report,
        customer_notes: job.customer_notes,
        base_notes: job.base_notes,
        admin_notes: job.admin_notes,
        decline_notes: job.decline_notes,
        minutes_waited: job.minutes_waited,
        is_inbound_connect: job.is_inbound_connect,
        is_hand_unloading: job.is_hand_unloading,
        is_dangerous_goods: job.is_dangerous_goods,
        is_tailgate_required: job.is_tailgate_required,
        timeslot: job.timeslot,
        timeslot_depots: job.timeslot_depots,
        last_free_at: job.last_free_at,
        // sort_id: job.sort_id,
        quoted_price: job.quoted_price,
        transport_type: job.transport_type,
        transport_location: job.transport_location,
      },
      // // console.log("job", job)
    },
    onCompleted: async (data) => {
      //update job items
      for (let jobItem of jobItems) {
        if (jobItem.is_new) {
          handleCreateJobItem({
            input: {
              ...jobItem,
              job_id: parseInt(data.updateJob.id),
              is_new: undefined,
              dimension_height_cm: undefined,
              dimension_width_cm: undefined,
              dimension_depth_cm: undefined,
              volume_cm: undefined,
              id: undefined,
              item_type: undefined,
            },
          });
        } else {
          handleUpdateJobItem({
            variables: {
              input: {
                ...jobItem,
                item_type: undefined,
                is_new: undefined,
                dimension_height_cm: undefined,
                dimension_width_cm: undefined,
                dimension_depth_cm: undefined,
                volume_cm: undefined,
              },
            },
          });
        }
      }
      //delete job items
      originalJobItems.forEach((originalJobItem) => {
        if (
          !jobItems.find((jobItem) => {
            return jobItem.id == originalJobItem.id;
          })
        ) {
          handleDeleteJobItem({
            variables: {
              id: parseInt(originalJobItem.id),
            },
          });
        }
      });
      //update job destinations
      let _jobDestinations = [...jobDestinations];
      for (let jobDestination of _jobDestinations) {
        if (jobDestination.is_new) {
           await handleCreateJobDestination({
            input: {
              ...jobDestination,
              job_id: parseInt(data.updateJob.id),
              id: undefined,
              is_new: undefined,
              customer_id: undefined,
              label: undefined,
              is_pickup: false,
              updated_at: undefined,
              route_point: undefined,
              issue_reports: undefined,
              media: undefined,
            },
          });
        } else {
          handleUpdateJobDestination({
            variables: {
              input: {
                ...jobDestination,
                route_point: undefined,
                customer_id: undefined,
                label: undefined,
                updated_at: undefined,
                is_pickup: false,
                issue_reports: undefined,
                media: undefined,
                is_new: undefined,
              },
            },
          });
        }
      }
      //delete job destinations
      originalJobDestinations.forEach((originalJobDestination) => {
        if (
          !jobDestinations.find((jobDestination) => {
            return jobDestination.id == originalJobDestination.id;
          })
        ) {
          handleDeleteJobDestination({
            variables: {
              id: parseInt(originalJobDestination.id),
            },
          });
        }
      });

      handleUpdateJobDestination({
        variables: {
          input: {
            ...pickUpDestination,
            route_point: undefined,
            label: undefined,
            is_pickup: true,
            updated_at: undefined,
            issue_reports: undefined,
            media: undefined,
            is_new: undefined,
          },
        },
      });
      await getJob();
      setIsSaving(false);

      toast({
        title: "Job updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      setIsSaving(false); // redeploy
      showGraphQLErrorToast(error);
    },
  });

  const [handleDeleteJob, {}] = useMutation(DELETE_JOB_MUTATION, {
    variables: {
      id: id,
    },
    onCompleted: () => {
      toast({
        title: "Job deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push("/admin/jobs");
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  useQuery(GET_JOB_CATEGORIES_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setJobCategories([]);
      data.jobCategorys.data.map((driverStatus: any) => {
        setJobCategories((jobCategories) => [
          ...jobCategories,
          {
            value: parseInt(driverStatus.id),
            label: driverStatus.name,
          },
        ]);
      });
    },
  });
  useQuery(GET_JOB_STATUSES_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setJobStatuses([]);
      data.jobStatuses.data.map((jobStatus: any) => {
        setJobStatuses((_entity) => [
          ..._entity,
          {
            value: parseInt(jobStatus.id),
            label: jobStatus.name,
          },
        ]);
      });
    },
  });
  useQuery(GET_DRIVERS_QUERY, {
    variables: {
      query: debouncedSearchDriver,
      page: 1,
      first: 10000,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setDrivers([]);
      data.drivers.data.map((driver: any) => {
        setDrivers((_entity) => [
          ..._entity,
          {
            value: parseInt(driver.id),
            label: driver.full_name,
          },
        ]);
      });
    },
  });

  useQuery(GET_JOB_TYPES_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setJobTypeOptions([]);
      data.jobTypes.data.map((_entity: any) => {
        setJobTypeOptions((jobTypes) => [
          ...jobTypes,
          {
            value: parseInt(_entity.id),
            label: _entity.name,
          },
        ]);
      });
    },
  });
  // Use the useQuery hook to fetch the data
  const { data } = useQuery(
    GET_JOB_PRICE_CALCULATION_DETAIL_QUERY,
    {
      variables: {
        job_id: job.id,
      },
      // skip: !job.id,
      skip: !job.id || !Boolean(job.id), // To ensure no falsy value interferes
      onCompleted: (data) => {
        // Process the data as needed
        // console.log(data, "d");
        setIsUpdateMode(true); // Data exists, so it's an update
        setPricecalculationid(data.jobPriceCalculationDetail.id);
        setRefinedData({
          ...data.jobPriceCalculationDetail,
          cbm_auto: data.jobPriceCalculationDetail?.cbm_auto,
          customer_id: data.jobPriceCalculationDetail?.customer_id,
          dangerous_goods: data.jobPriceCalculationDetail?.dangerous_goods,
          freight: data.jobPriceCalculationDetail?.freight,
          fuel: data.jobPriceCalculationDetail?.fuel,
          time_slot: data.jobPriceCalculationDetail?.time_slot,
          tailgate: data.jobPriceCalculationDetail?.tailgate,
          hand_unload: data.jobPriceCalculationDetail?.hand_unload,
          stackable: data.jobPriceCalculationDetail?.stackable,
          total_price: data.jobPriceCalculationDetail?.total_price,
          total_weight: data.jobPriceCalculationDetail?.total_weight,
        });
        setQuoteCalculationRes({
          ...data.jobPriceCalculationDetail,
          total_price: data.jobPriceCalculationDetail?.total_price,
          total_weight: data.jobPriceCalculationDetail?.total_weight,
          cbm_auto: data.jobPriceCalculationDetail?.cbm_auto,
          customer_id: data.jobPriceCalculationDetail?.customer_id,
          dangerous_goods: data.jobPriceCalculationDetail?.dangerous_goods,
          freight: data.jobPriceCalculationDetail?.freight,
          fuel: data.jobPriceCalculationDetail?.fuel,
          hand_unload: data.jobPriceCalculationDetail?.hand_unload,
          stackable: data.jobPriceCalculationDetail.stackable,
          time_slot: data.jobPriceCalculationDetail?.time_slot,
          tailgate: data.jobPriceCalculationDetail?.tailgate,
        });
        setButtonText("Update Quote");

        // console.log(data.jobPriceCalculationDetail, "imp");
      },
      onError: (error) => {
        // Handle the error and set data to empty
        console.error("Error fetching job price calculation detail:", error);
        setIsUpdateMode(false); // No data found, so we need to create a new entry
        setRefinedData(defaultJobQuoteData);
        setQuoteCalculationRes(defaultJobPriceCalculationDetail);

        setButtonText("Get A Quote");
      },
    },
  );
  useQuery(GET_ITEM_TYPES_QUERY, {
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      const itemTypesArray = data.itemTypes.data.map(
        (_entity: { id: string; name: string }) => ({
          value: parseInt(_entity.id),
          label: _entity.name,
        }),
      );

      // Sort items, pushing "Other" to the end
      const sortedItemTypes = itemTypesArray.sort(
        (
          a: { value: number; label: string },
          b: { value: number; label: string },
        ) => {
          if (a.label === "Other") return 1;
          if (b.label === "Other") return -1;
          return 0;
        },
      );

      setItemTypes(sortedItemTypes);
    },
  });

  useQuery(GET_COMPANYS_QUERY, {
    variables: {
      query: debouncedSearch,
      page: 1,
      first: 10000,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      const newCompaniesOptions = data.companys.data.map((_entity: any) => ({
        value: parseInt(_entity.id),
        label: _entity.name,
      }));

      setCompaniesOptions(newCompaniesOptions);

      // If a company is already selected, update refinedData with its properties
      const selectedCompany = newCompaniesOptions.find(
        (entity: { value: number }) => entity.value === job.company_id,
      );

      if (selectedCompany) {
        setRefinedData({
          ...refinedData,
        });
      }
    },
  });

  const { data: _companyRatesData, refetch: getCompanyRates } = useQuery(
    GET_COMPANY_RATE_QUERY,
    {
      variables: { company_id: job?.company_id || "" },
      skip: !job?.company_id,
      fetchPolicy: "network-only",
      onCompleted: (_data) => {
        if (data?.getRatesByCompany) {
          const rates = [...data.getRatesByCompany];
          setCompanyRates(rates);
          setRefinedData((prevData) => ({
            ...prevData,
            company_rates: rates,
          }));
        }
      },
    },
  );
  const handleRemoveFromJobItems = (index: number) => {
    let _jobItems = [...jobItems];
    _jobItems.splice(index, 1);
    setJobItems(_jobItems);
  };
  const handleJobItemChanged = (
    value: any,
    index: number,
    fieldToUpdate?: string,
  ) => {
    let _jobItems = [...jobItems];
    if (!value.dimension_height_cm) {
      value.dimension_height_cm = (
        parseFloat(value.dimension_height) * 100
      ).toFixed(2);
    }
    if (!value.dimension_width_cm) {
      value.dimension_width_cm = (
        parseFloat(value.dimension_width) * 100
      ).toFixed(2);
    }
    if (!value.dimension_depth_cm) {
      value.dimension_depth_cm = (
        parseFloat(value.dimension_depth) * 100
      ).toFixed(2);
    }
    if (fieldToUpdate == "volume") {
      value.volume =
        value.dimension_height *
        value.dimension_width *
        value.dimension_depth *
        value.quantity;
      value.volume_cm = (value.volume * 100).toFixed(2);
    }
    _jobItems[index] = value;
    setJobItems(_jobItems);
    setPrevJobState((prevState) => ({
      ...prevState,
      job_items: _jobItems,
    }));
  };
  const addToJobItems = () => {
    let nextId = 1; // Default to 1 if jobItems is empty
    if (jobItems.length > 0) {
      nextId = jobItems[jobItems.length - 1].id + 1;
    }
    setJobItems((jobItems) => [
      ...jobItems,
      { ...defaultJobItem, ...{ id: nextId, is_new: true } },
    ]);
  };

  useEffect(() => {
    dateChanged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobDateAt, readyAt, dropAt]);
  const dateChanged = () => {
    try {
      setJob({
        ...job,
        ready_at: formatDateTimeToDB(jobDateAt, readyAt),
        drop_at: formatDateTimeToDB(jobDateAt, dropAt),
      });
    } catch (e) {
      //// console.log(e);
    }
  };
  const addToJobDestinations = () => {
    let nextId = jobDestinations[jobDestinations.length - 1]
      ? jobDestinations[jobDestinations.length - 1].id + 1
      : 1;
    setJobDestinations((jobDestinations) => [
      ...jobDestinations,
      { ...defaultJobDestination, ...{ id: nextId, is_new: true } },
    ]);
  };
  const handleRemoveFromJobDestinations = (index: number) => {
    let _jobDestinations = [...jobDestinations];
    _jobDestinations.splice(index, 1);
    setJobDestinations(_jobDestinations);
  };
  //handleJobDestinationChanged
  const handleJobDestinationChanged = async (value: any, index: number) => {
    let _jobDestinations = [...jobDestinations];
    _jobDestinations[index] = value;
    setJobDestinations(_jobDestinations);
    //check if any job destination is_saved_address and populate setSavedAddresses
  };
  //handleDeleteJobItem
  const [handleDeleteJobItem, {}] = useMutation(DELETE_JOB_ITEM_MUTATION, {
    onCompleted: () => {
      // console.log("Job Item Deleted", data);
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });
  //handleDelete
  const [handleDeleteJobDestination, {}] = useMutation(
    DELETE_JOB_DESTINATION_MUTATION,
    {
      onCompleted: (_data) => {
        // console.log("Job destination Deleted", data);
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );

  const handleCreateJobItem = (jobItem: any) => {
    return new Promise((resolve, reject) => {
      createJobItem({ variables: jobItem })
        .then(({ data }) => {
          resolve(data);
        })
        .catch((error) => {
          reject(error);
          showGraphQLErrorToast(error);
        });
    });
  };
  const [createJobItem] = useMutation(CREATE_JOB_ITEM_MUTATION);
  //handleCreateJobDestination
  const handleCreateJobDestination = (jobDestination: any) => {
    return new Promise((resolve, reject) => {
      createJobDestination({ variables: jobDestination })
        .then(({ data }) => {
          resolve(data);
        })
        .catch((error) => {
          reject(error);
          showGraphQLErrorToast(error);
        });
    });
  };
  const [createJobDestination] = useMutation(CREATE_JOB_DESTINATION_MUTATION);
  //handleUpdateJobItems
  const [handleUpdateJobItem, {}] = useMutation(UPDATE_JOB_ITEM_MUTATION, {
    onCompleted: (_data) => {
      // console.log("Job item updated");
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });
  //handleUpdateJobDestinations
  const [handleUpdateJobDestination, {}] = useMutation(
    UPDATE_JOB_DESTINATION_MUTATION,
    {
      onCompleted: (_data) => {
        // console.log("Job destination updated");
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );
  //deleteMedia
  const [handleDeleteMedia, {}] = useMutation(DELETE_MEDIA_MUTATION, {
    onCompleted: (_data) => {
      toast({
        title: "Attachment deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      getJob();
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  const { refetch: getCustomersByCompanyId } = useQuery(GET_CUSTOMERS_QUERY, {
    onCompleted: (data) => {
      setCustomerOptions([]);
      setCustomerOptions(
        formatToSelect(data.customers.data, "id", "full_name"),
      );
    },
  });
  const { refetch: getCustomerAddresses } = useQuery(
    GET_CUSTOMER_ADDRESSES_QUERY,
    {
      variables: {
        query: "",
        page: 1,
        first: 200,
        orderByColumn: "id",
        orderByOrder: "ASC",
        customer_id: job.customer_id,
      },
      onCompleted: (data) => {
        setSavedAddressesSelect([]);
        setSavedAddressesSelect(
          formatToSelect(
            data.customerAddresses.data,
            "id",
            "address_business_name",
          ),
        );
      },
    },
  );

  const handleJobCcEmailsChange = useCallback(
    (event: SyntheticEvent, jobCcEmailTags: string[]) => {
      setJobCcEmailTags(
        jobCcEmailTags.filter((email) => {
          return re.test(email);
        }),
      );
    },
    [re],
  );
  const handleJobCcEmailAdd = useCallback(
    (event: SyntheticEvent, email: string) => {
      if (re.test(email)) {
        setCreatedCcEmail(email);
        setTimeout(() => {
          handleCreateJobCcEmail();
        }, 500);
      } else {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [re],
  );

  const handleJobCcEmailRemove = useCallback(
    (event: SyntheticEvent, index: number) => {
      setDeleteJobCcEmailId(jobCcEmails[index]["id"]);
      setJobCcEmails(jobCcEmails.filter((_, i) => i !== index));
      setJobCcEmailTags(jobCcEmailTags.filter((_, i) => i !== index));

      setTimeout(() => {
        handleDeleteJobCcEmail();
      }, 500);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [jobCcEmailTags, jobCcEmails],
  );

  const [handleDeleteJobCcEmail, {}] = useMutation(
    DELETE_JOB_CC_EMAIL_MUTATION,
    {
      variables: {
        id: deleteJobCcEmailId,
      },
      onCompleted: (_data) => {},
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );

  const [handleCreateJobCcEmail, {}] = useMutation(
    CREATE_JOB_CC_EMAIL_MUTATION,
    {
      variables: {
        input: {
          job_id: job.id,
          email: createdCcEmail,
        },
      },
      onCompleted: (_data) => {
        toast({
          title: "Additional email notification created",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        getJob();
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );

  useEffect(() => {
    if (job.customer_id && customerOptions.length > 0) {
      setCustomerSelected({
        ...customerOptions.find((_e) => _e.value == job.customer_id)?.entity,
      });
      getCustomerAddresses();
    }
    if (job.customer_id == null) {
      setCustomerSelected(defaultCustomer);
      setSavedAddressesSelect([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.customer_id, customerOptions]);

  // useEffect(() => {
  //   // Function to calculate filtered job types based on cutoff logic
  //   if (
  //     new Date(job.created_at).setHours(0, 0, 0, 0) <
  //     new Date(NEW_CUTOFF_RULES_START_DATE).setHours(0, 0, 0, 0)
  //   ) {
  //     return;
  //   }

  //   const calculateFilteredOptions = async () => {
  //     let filteredOptions = Array.isArray(jobTypeOptions)
  //       ? [...jobTypeOptions]
  //       : [];

  //     if (
  //       !job.job_category_id ||
  //       pickUpDestination.lat === 0 ||
  //       pickUpDestination.lng === 0
  //     ) {
  //       return setFilteredJobTypeOptions(filteredOptions);
  //     }

  //     try {
  //       const timezone = await getTimezone(
  //         pickUpDestination.lat,
  //         pickUpDestination.lng,
  //       );
  //       if (job.job_category_id == 1) {
  //         // LCL Bookings
  //         if (isSameDayJob) {
  //           filteredOptions = filteredOptions.filter(
  //             (opt) => opt.label !== "Standard",
  //           );
  //           resetJobTypeAndShowToast();
  //         } else if (isTomorrowJob) {
  //           const isAfterLclCutoff = isAfterCutoff("16:00", timezone);

  //           if (isAfterLclCutoff) {
  //             filteredOptions = filteredOptions.filter(
  //               (opt) => opt.label !== "Standard",
  //             );
  //             resetJobTypeAndShowToast();
  //           }
  //         }
  //       } else if (job.job_category_id == 2) {
  //         // Airfreight Bookings
  //         if (isSameDayJob) {
  //           const isAfterAirfreightCutoff = isAfterCutoff("11:00", timezone);

  //           if (isAfterAirfreightCutoff) {
  //             filteredOptions = filteredOptions.filter(
  //               (opt) => opt.label !== "Standard",
  //             );
  //             resetJobTypeAndShowToast();
  //           }
  //         }
  //       }
  //       if (
  //         job.job_type_id &&
  //         !filteredOptions.some(
  //           (opt) => Number(opt.value) == Number(job.job_type_id),
  //         )
  //       ) {
  //         // Instead of nullifying, preserve the job type
  //         const existingJobType = jobTypeOptions.find(
  //           (type) => Number(type.id) === Number(job.job_type_id)
  //         );

  //         if (existingJobType) {
  //           // If the job type exists in all options, keep it
  //           setJob({
  //             ...job,
  //             job_type_id: job.job_type_id
  //           });
  //         }
  //       }

  //       setFilteredJobTypeOptions(filteredOptions);
  //     } catch (error) {
  //       console.error(
  //         "Error fetching timezone or applying cutoff logic",
  //         error,
  //       );
  //     }
  //   };

  //   calculateFilteredOptions();
  // }, [
  //   job.job_category_id,
  //   jobDateAt,
  //   pickUpDestination,
  //   jobTypeOptions,
  //   isSameDayJob,
  //   isTomorrowJob,
  // ]);

  // Define the reusable function
  // const resetJobTypeAndShowToast = () => {
  //   if (job.job_type_id == 1) {
  //     setJob({
  //       ...job,
  //       ready_at: formatDateTimeToDB(jobDateAt, readyAt),
  //       drop_at: formatDateTimeToDB(jobDateAt, dropAt),
  //       job_type_id: null,
  //     });
  //     toast({
  //       title: "Job Type Required",
  //       description:
  //         "Standard service is no longer available for this time. Please select Express or Urgent.",
  //       status: "warning",
  //       duration: 3000,
  //       isClosable: true,
  //     });
  //   }
  // };

  const handleCreateJobPriceCalculationDetail = (
    jobPriceDetail: CreateJobPriceCalculationDetailInput,
  ) => {
    return new Promise((resolve, reject) => {
      createJobPriceCalculationDetail({ variables: { input: jobPriceDetail } })
        .then(({ data }) => {
          resolve(data);
        })
        .catch((error) => {
          reject(error);
          showGraphQLErrorToast(error);
        });
    });
  };

  const [createJobPriceCalculationDetail] = useMutation(
    CREATE_JOB_PRICE_CALCULATION_DETAIL_MUTATION,
  );

  const handleUpdateJobPriceCalculationDetail = (quoteCalculationRes: any) => {
    //console.log(quoteCalculationRes, "quoteCalculationRes");
    return new Promise((resolve, reject) => {
      updateJobPriceCalculationDetail({
        variables: {
          job_id: Number(job.id),
          input: {
            // job_id: Number(updatedData.job_id),
            customer_id: Number(job.customer_id),
            cbm_auto: Number(quoteCalculationRes.cbm_auto), // Ensure type casting
            total_weight: Number(quoteCalculationRes.total_weight),
            freight: Number(quoteCalculationRes.freight),
            fuel: Number(quoteCalculationRes.fuel),
            hand_unload: Number(quoteCalculationRes.hand_unload),
            dangerous_goods: Number(quoteCalculationRes.dangerous_goods),
            time_slot: Number(quoteCalculationRes.time_slot),
            tail_lift: Number(quoteCalculationRes.tail_lift),
            stackable: Number(quoteCalculationRes.stackable),
            total: Number(quoteCalculationRes.total),
          },
        },
      })
        .then(({ data }) => {
          //console.log("Mutation response:", data);
          resolve(data);
        })
        .catch((error) => {
          reject(error);
          showGraphQLErrorToast(error);
        });
    });
  };

  const [updateJobPriceCalculationDetail] = useMutation(
    UPDATE_JOB_PRICE_CALCULATION_DETAIL_MUTATION,
  );

  const validateAddresses = () => {
    if (!pickUpDestination?.address) {
      toast({
        title: "Pickup address is required.",
        description: "Please enter the address in the correct format.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    if (jobDestinations.some((destination) => !destination.address)) {
      toast({
        title: "Delivery address is required.",
        description:
          "Please ensure all delivery addresses are properly entered.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
    return true;
  };

  const sendFreightData = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_PRICE_QUOTE_API_URL;
    // console.log(string, "st");
    if (!validateAddresses()) return;
    // Remove duplicate check that was causing multiple API calls
    setButtonText("Get A Quote");
    const today = new Date().toISOString(); // Get current date and time in ISO format

    const jobDestination1 =
      jobDestinations.length > 0
        ? {
            state: jobDestinations[0]?.address_state,
            suburb: jobDestinations[0]?.address_city,
            postcode: jobDestinations[0]?.address_postal_code,
            address: jobDestinations[0]?.address,
          }
        : null;

    const selectedCategoryName = jobCategories.find(
      (job_category) => job_category.value == job?.job_category_id,
    )?.label;
    // const selectedstate = locationOptions.find(
    //   (item) => item.label == job.pick_up_state,
    // )?.label;

    const selectedstate = locationOptions.find(
      (location) =>
        location.label?.toLowerCase() == job?.pick_up_state?.toLowerCase(),
    );
    console.log(selectedstate, "selectedstate");
    const selectedJobTypeName = jobTypeOptions.find(
      (job_type) => job_type.value == job.job_type_id,
    )?.label;

    const selectedDepot = depotOptions.find(
      (depot) => depot.value === job.timeslot_depots,
    )?.label;
// debugger
    const filteredCompanyRates = companyRates?.filter(rate => 
      rate.state === jobDestination1?.state
    );
    // console.log(filteredCompanyRates, "filteredCompanyRates")

    const payload = {
      customer_id: Number(job.customer_id),
      freight_type: refinedData.freight_type || selectedCategoryName,
      transport_type: job.transport_type,
      service_choice: selectedJobTypeName || refinedData.service_choice,
      // cbm_rate: refinedData.cbm_rate,
      // minimum_charge: refinedData.minimum_charge,
      // area: refinedData.area,
      state: refinedData.state || selectedstate?.label,
      state_code: refinedData.state_code || selectedstate?.value,
      company_rates:
        (job.job_category_id == 1 && selectedstate?.value === "QLD") ||
        selectedstate?.value === "VIC"
          ? filteredCompanyRates.map((rate) => ({
              company_id: rate.company_id,
              seafreight_id: rate.seafreight_id,
              area: rate.area,
              cbm_rate: rate.cbm_rate,
              state: rate.state,
              minimum_charge: rate.minimum_charge,
            }))
          : [],
      job_pickup_address: {
        state: pickUpDestination?.address_state,
        suburb: pickUpDestination?.address_city,
        postcode: pickUpDestination?.address_postal_code,
        address: pickUpDestination?.address,
      },
      job_destination_address:
        jobDestinations.length > 0
          ? {
              state: jobDestinations[0]?.address_state,
              suburb: jobDestinations[0]?.address_city,
              postcode: jobDestinations[0]?.address_postal_code,
              address: jobDestinations[0]?.address,
            }
          : {},
      pickup_time: {
        ready_by: readyAt,
      },
      delivery_time: {
        drop_by: dropAt,
      },
      surcharges: {
        hand_unload: job.is_hand_unloading || false,
        dangerous_goods: job.is_dangerous_goods || false,
        time_slot: job.is_inbound_connect || null,
        timeslot_depots: job.is_inbound_connect? job.timeslot_depots || selectedDepot : '', // Pass selectedDepot here
        tail_lift: job.is_tailgate_required || null,
        stackable: false, // If applicable, update this
      },
      job_items: jobItems.map((item) => ({
        id: item.id,
        name: item.name || "",
        notes: item.notes || "",
        quantity: item.quantity,
        volume: item.volume,
        weight: item.weight,
        dimension_height: item.dimension_height,
        dimension_width: item.dimension_width,
        dimension_depth: item.dimension_depth,
        job_destination: jobDestination1 || null,
        item_type: {
          id: item.item_type?.id || "",
          name: item.item_type?.name || "",
        },
        created_at: refinedData.created_at || today,
        updated_at: refinedData.updated_at || today,
      })),
    };

    console.log(payload);

    try {
      const response = await axios.post(apiUrl, payload, {
        headers: { "Content-Type": "application/json" },
      });

      console.log("Response Data:", response.data);
      // setQuoteCalculationRes({
      //   ...response?.data,
      //   time_slot: response?.data?.time_slot || 0, // Ensure time_slot is set
      // });
      const calculationData = response?.data;
      setQuoteCalculationRes({
        ...quoteCalculationRes,
        time_slot: (calculationData as CalculationData)?.time_slot, // Ensure time_slot is set with type assertion
        cbm_auto: (calculationData as CalculationData)?.cbm_auto,
        total_weight: (calculationData as CalculationData)?.total_weight,
        freight: (calculationData as CalculationData)?.freight,
        fuel: (calculationData as CalculationData)?.fuel,
        hand_unload: (calculationData as CalculationData)?.hand_unload,
        dangerous_goods: (calculationData as CalculationData)?.dangerous_goods,
        tail_lift: (calculationData as CalculationData)?.tail_lift,
        stackable: (calculationData as CalculationData)?.stackable,
        total: (calculationData as CalculationData)?.total,
      });
      console.log(calculationData, "Update mode");
      toast({ title: "Quote Calculation Success", status: "success" });
      // console.log(isUpdateMode);
      // console.log(quoteCalculationRes);
      // console.log("Quote Calculation Response:", response.data);
      if (isUpdateMode) {
        await handleUpdateJobPriceCalculationDetail(calculationData)
          .then((_data) => {
            //console.log("Updated successfully:", data);
            toast({
              title: "Quote price updated",
              status: "success",
              duration: 3000,
              isClosable: true,
            });
          })
          .catch((error) => {
            console.error("Error updating job price:", error);
          });
      } else {
        //console.log("Update mode");
        const calculationData = response.data as {
          cbm_auto: number;
          total_weight: number;
          freight: number;
          fuel: number;
          hand_unload: number;
          dangerous_goods: number;
          time_slot: number;
          tail_lift: number;
          stackable: number;
          total: number;
        };

        await handleCreateJobPriceCalculationDetail({
          job_id: Number(job.id),
          customer_id: Number(job.customer_id),
          cbm_auto: Number(calculationData.cbm_auto), // Ensure type casting
          total_weight: Number(calculationData.total_weight),
          freight: Number(calculationData.freight),
          fuel: Number(calculationData.fuel),
          hand_unload: Number(calculationData.hand_unload),
          dangerous_goods: Number(calculationData.dangerous_goods),
          time_slot: Number(calculationData.time_slot),
          tail_lift: Number(calculationData.tail_lift),
          stackable: Number(calculationData.stackable),
          total: Number(calculationData.total),
        });
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSaveJobPriceCalculation = () => {
    //console.log(isUpdateMode);
    const hasChanged =
      prevJobState.freight_type !== refinedData.freight_type ||
      prevJobState.transport_type !== job.transport_type ||
      prevJobState.transport_location !== job.transport_location ||
      prevJobState.job_items.some(
        (item, index) =>
          item.id !== jobItems[index].id ||
          item.name !== jobItems[index].name ||
          item.notes !== jobItems[index].notes ||
          item.quantity !== jobItems[index].quantity ||
          item.volume !== jobItems[index].volume ||
          item.weight !== jobItems[index].weight ||
          item.dimension_height !== jobItems[index].dimension_height ||
          item.dimension_width !== jobItems[index].dimension_width ||
          item.dimension_depth !== jobItems[index].dimension_depth,
      );
    if (isUpdateMode) {
      if (hasChanged) {
        setButtonText("Quote");
        sendFreightData();
      } else {
        // setIsSaving(true);
        // handleUpdateJob();
        toast({
          title: "No changes detected",
          description: "No changes detected, no need to update.",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
    } else {
      // console.log("add");
      setButtonText("Quote");
      sendFreightData();
    }
  };

  return (
    <AdminLayout>
      <Box
        className="mk-customers-id overflow-auto"
        pt={{ base: "130px", md: "97px", xl: "97px" }}
        backgroundColor="white"
      >
        {/* Main Fields */}
        <Grid
          pr="24px"
          className="mk-mainInner"
          h={{
            base: "calc(100vh - 130px)",
            md: "calc(100vh - 97px)",
            xl: "calc(100vh - 97px)",
          }}
        >
          {!jobLoading && (
            <Grid pl="6" backgroundColor="white">
              <FormControl>
                <Flex justify="space-between" align="center" className="my-8">
                  <h1 className="">Delivery #{job.id}</h1>

                  <Flex alignItems="center">
                    {job.quote?.id && (
                      <Button
                        hidden={!isAdmin}
                        variant="primary"
                        isDisabled={isSaving}
                        onClick={() => {
                          router.push("/admin/quotes/" + job.quote?.id);
                        }}
                        mr="2"
                      >
                        View Quote
                      </Button>
                    )}

                    <Button
                      hidden={!isAdmin}
                      variant="primary"
                      isDisabled={isSaving}
                      onClick={() => {
                        setIsSaving(true);
                        handleUpdateJob();
                      }}
                    >
                      {isSaving ? "Saving Changes..." : "Save Changes"}
                    </Button>
                  </Flex>
                </Flex>

                {/* Tabs */}

                <TabsComponent
                  tabs={tabs}
                  onChange={(tabId) => setActiveTab(tabId)}
                />

                {/* Job Details */}
                {tabId == 1 && (
                  <Box mt={10}>
                    {/* Basic fields */}
                    {isAdmin ? (
                      <Box mb="16px">
                        <CustomInputField
                          isSelect={true}
                          optionsArray={jobStatuses}
                          label="Job Status:"
                          value={jobStatuses.find(
                            (job_status) =>
                              job_status?.value == job.job_status_id,
                          )}
                          placeholder=""
                          onChange={(e) => {
                            setJob({
                              ...job,
                              job_status_id: e.value || null,
                            });
                          }}
                        />
                        <CustomInputField
                          isSelect={true}
                          optionsArray={drivers}
                          label="Assigned to:"
                          onInputChange={(e) => {
                            onChangeCustomerSearchQuery(e);
                          }}
                          value={drivers.find(
                            (driver) => driver.value == job.driver_id,
                          )}
                          placeholder=""
                          onChange={(e) => {
                            setJob({
                              ...job,
                              driver_id: e.value || null,
                            });
                          }}
                        />
                        <CustomInputField
                          isSelect={true}
                          optionsArray={jobCategories}
                          label="Job category:"
                          value={jobCategories.find(
                            (job_category) =>
                              job_category.value == job.job_category_id,
                          )}
                          placeholder=""
                          onChange={(e) => {
                            const selectedCategory = e.value;
                            const selectedCategoryName = jobCategories.find(
                              (job_category) =>
                                job_category.value === selectedCategory,
                            )?.label;
                            setJob({
                              ...job,
                              job_category_id: selectedCategory || null,
                            });
                            setRefinedData({
                              ...refinedData,
                              freight_type: selectedCategoryName || null,
                            });
                          }}
                        />

                        <CustomInputField
                          isSelect={true}
                          optionsArray={customerOptions}
                          label="Customer:"
                          value={
                            customerOptions.find(
                              (entity) => entity.value == job.customer_id,
                            ) || { value: null, label: "" }
                          }
                          placeholder=""
                          onChange={(e) => {
                            // Update job with the selected customer ID
                            setJob({
                              ...job,
                              customer_id: e.value || null,
                            });

                            // Fetch the selected customer details
                            const selectedCustomer = customerOptions.find(
                              (option) => option.value === e.value,
                            )?.entity;

                            if (selectedCustomer) {
                              getCustomerAddresses(); // Re-fetch customer addresses
                            }
                          }}
                        />

                        {!isCompany && (
                          <CustomInputField
                            isSelect={true}
                            optionsArray={companiesOptions}
                            label="Company:"
                            onInputChange={(e) => {
                              onChangeSearchQuery(e);
                            }}
                            value={companiesOptions.find(
                              (entity) => entity.value == job.company_id,
                            )}
                            placeholder=""
                            isDisabled={true}

                            // onChange={(e) => {
                            //   setJob({
                            //     ...job,
                            //     company_id: e.value || null,
                            //     customer_id: null,
                            //   });
                            //   getCustomersByCompanyId({
                            //     query: "",
                            //     page: 1,
                            //     first: 100,
                            //     orderByColumn: "id",
                            //     orderByOrder: "ASC",
                            //     company_id: e.value,
                            //   });
                            // }}
                          />
                        )}

                        <Flex alignItems="center" mb="16px">
                          <FormLabel
                            display="flex"
                            mb="0"
                            width="200px"
                            fontSize="sm"
                            fontWeight="500"
                            _hover={{ cursor: "pointer" }}
                          >
                            <SimpleGrid columns={{ sm: 1 }}>
                              <GridItem>
                                Additional email notification to:{" "}
                              </GridItem>
                            </SimpleGrid>
                          </FormLabel>
                          <Box>
                            <TagsInput
                              tags={jobCcEmailTags}
                              onTagsChange={handleJobCcEmailsChange}
                              onTagAdd={handleJobCcEmailAdd}
                              onTagRemove={handleJobCcEmailRemove}
                              wrapProps={{
                                direction: "column",
                                align: "start",
                                width: "300px",
                              }}
                              wrapItemProps={(isInput) =>
                                isInput ? { alignSelf: "stretch" } : null
                              }
                            />
                          </Box>
                        </Flex>

                        <CustomInputField
                          label="Operator phone:"
                          placeholder=""
                          isDisabled={true}
                          name="operator_phone"
                          value={customerSelected.phone_no}
                          // onChange={
                            // () => {}
                            //setJob({
                            //  ...job,
                            //  [e.target.name]: e.target.value,
                            //})
                          // }
                        />
                        <CustomInputField
                          label="Operator email:"
                          placeholder=""
                          name="operator_email"
                          isDisabled={true}
                          value={customerSelected.email}
                          // onChange={
                            // (e) => {}
                            //setJob({
                            //  ...job,
                            //  [e.target.name]: e.target.value,
                            //})
                          // }
                        />
                        <CustomInputField
                          label="Date:"
                          type={"date"}
                          placeholder=""
                          name="job_date_at"
                          value={jobDateAt}
                          onChange={(e) => {
                            setJobDateAt(e.target.value);
                            setIsSameDayJob(today === e.target.value);
                            setIsTomorrowJob(
                              new Date(e.target.value).toDateString() ===
                                new Date(
                                  new Date(today).setDate(
                                    new Date(today).getDate() + 1,
                                  ),
                                ).toDateString(),
                            );
                          }}
                        />

                        <CustomInputField
                          label="Ready by:"
                          type={"time"}
                          placeholder=""
                          name="ready_at"
                          value={readyAt}
                          onChange={(e) => {
                            setReadyAt(e.target.value);
                            setJob({
                              ...job,
                              ready_at: new Date(
                                `${jobDateAt} ${e.target.value}`,
                              ).toISOString(),
                              drop_at: new Date(
                                `${jobDateAt} ${dropAt}`,
                              ).toISOString(),
                            });
                          }}
                        />

                        <CustomInputField
                          label="Drop by:"
                          type={"time"}
                          placeholder=""
                          name="drop_at"
                          value={dropAt}
                          onChange={(e) => {
                            setDropAt(e.target.value);
                            setJob({
                              ...job,
                              ready_at: new Date(
                                `${jobDateAt} ${readyAt}`,
                              ).toISOString(),
                              drop_at: new Date(
                                `${jobDateAt} ${e.target.value}`,
                              ).toISOString(),
                            });
                          }}
                        />

                        <CustomInputField
                          label="Timeslot:"
                          placeholder=""
                          name="timeslot"
                          value={job.timeslot}
                          onChange={(e) =>
                            setJob({
                              ...job,
                              [e.target.name]: e.target.value,
                            })
                          }
                        />

                        <CustomInputField
                          label="Last Free Day:"
                          type={"date"}
                          placeholder=""
                          name="last_free_at"
                          value={job.last_free_at}
                          onChange={(e) => {
                            const value =
                              e.target.value == "" ? null : e.target.value;
                            setJob({
                              ...job,
                              [e.target.name]: value,
                            });
                          }}
                        />

                        <ColorSelect
                          label="Type:"
                          optionsArray={jobTypeOptions}
                          selectedJobId={job.job_type_id}
                          value={
                            job.job_type_id
                              ? jobTypeOptions.find(
                                  (jobType) => jobType.value == job.job_type_id,
                                )
                              : null
                          }
                          placeholder="Select type"
                          // onChange={(e) => {
                          //   //console.log(e, "e");
                          //   // setJob({
                          //   //   ...job,
                          //   //   job_type_id: e.value || null,
                          //   // });
                          //   const selectedCategory = e.value;
                          //   const selectedCategoryName = selectedCategory
                          //     ? jobTypeOptions.find(
                          //         (job_category) =>
                          //           job_category.value === selectedCategory,
                          //       )?.label
                          //     : null;

                          //   setJob({
                          //     ...job,
                          //     job_type_id: selectedCategory || null,
                          //   });

                          //   setRefinedData({
                          //     ...refinedData,
                          //     service_choice: selectedCategoryName || null,
                          //   });

                          //   // console.log(refinedData, "n");
                          //   // console.log(job, "job");
                          // }}
                        />

                        <CustomInputField
                          label="Reference:"
                          placeholder=""
                          name="reference_no"
                          value={job.reference_no}
                          onChange={(e) =>
                            setJob({
                              ...job,
                              [e.target.name]: e.target.value,
                            })
                          }
                        />

                        <CustomInputField
                          label="Booked By:"
                          placeholder=""
                          name="booked_by"
                          value={job.booked_by}
                          onChange={(e) =>
                            setJob({
                              ...job,
                              [e.target.name]: e.target.value,
                            })
                          }
                        />

                        <CustomInputField
                          isInput
                          label="Quoted Price (Buy Price)"
                          placeholder=""
                          name="quoted_price"
                          value={job.quoted_price}
                          onChange={(e) =>
                            setJob({
                              ...job,
                              [e.target.name]: e.target.value,
                            })
                          }
                        />

                        <CustomInputField
                          isTextArea={true}
                          label="Admin notes:"
                          placeholder="Admin notes"
                          name="admin_notes"
                          value={job.admin_notes}
                          onChange={(e) =>
                            setJob({
                              ...job,
                              [e.target.name]: e.target.value,
                            })
                          }
                        />
                        {/* Transport Type Select */}
                        <CustomInputField
                          key="transport_typeKey"
                          isSelect={true}
                          optionsArray={[
                            { value: "import", label: "Import" },
                            { value: "export", label: "Export" },
                          ]}
                          label="Transport Type"
                          name="transport_type"
                          value={[
                            { value: "import", label: "Import" },
                            { value: "export", label: "Export" },
                          ].find((_e) => _e.value === job.transport_type)}
                          placeholder=""
                          // onChange={(e) => {
                          //   setJob({ ...job, transport_type: e.value });
                          //   setRefinedData({
                          //     ...refinedData,
                          //     transport_type: e.value,
                          //   });
                          // }}
                        />

                        {/* Location Select */}
                        <CustomInputField
                          key="locationKey"
                          isSelect={true}
                          optionsArray={[
                            { value: "VIC", label: "Victoria" },
                            { value: "QLD", label: "Queensland" },
                          ]}
                          label="Location"
                          name="transport_location"
                          value={[
                            { value: "VIC", label: "Victoria" },
                            { value: "QLD", label: "Queensland" },
                          ].find((_e) => _e.value === job.transport_location)}
                          placeholder=""
                          // onChange={(e) => {
                          //   const newState = {
                          //     ...refinedData,
                          //     state_code: e.value,
                          //     state: e.label,
                          //   };
                          //   setJob({ ...job, transport_location: e.value });
                          //   setRefinedData(newState);
                          // }}
                        />
                        <Text
                          style={{
                            color: "red",
                            paddingLeft: "11.4rem",
                            fontSize: "14px",
                          }}
                        >
                          Note: For LCL and Airfreight Only
                        </Text>
                      </Box>
                    ) : (
                      <Box mb="16px">
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Status:
                          </Text>
                          <Text fontSize="sm">{job.job_status?.name}</Text>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Job category:
                          </Text>
                          <Text fontSize="sm">{job.job_category?.name}</Text>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Booked by:
                          </Text>

                          <SimpleGrid columns={{ sm: 1 }}>
                            <GridItem>
                              <Text fontSize="sm">
                                {job.customer?.full_name}
                              </Text>
                            </GridItem>
                            <GridItem>
                              <Text fontSize="xs" color={textColorSecodary}>
                                {job.company?.name}
                              </Text>
                            </GridItem>
                          </SimpleGrid>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Operator phone:
                          </Text>
                          <Text fontSize="sm">{job.customer?.phone_no}</Text>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Operator email:
                          </Text>
                          <Text fontSize="sm">{job.customer?.email}</Text>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Notification Emails:
                          </Text>
                          {job.job_cc_emails?.map((email: any) => (
                            <Text fontSize="sm" key={email?.email}>
                              {email?.email}
                              {", "}
                            </Text>
                          ))}
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Date:
                          </Text>
                          <Text fontSize="sm">
                            {formatDate(jobDateAt, "DD MMM YYYY")}
                          </Text>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Ready by:
                          </Text>
                          <Text fontSize="sm">{formatTime(job.ready_at)}</Text>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Drop by:
                          </Text>
                          <Text fontSize="sm">{formatTime(job.drop_at)}</Text>
                        </Flex>
                        <Flex alignItems="center" mb={"16px"}>
                          <Text width="200px" fontSize="sm">
                            Reference:
                          </Text>
                          <Text fontSize="sm">{job.reference_no}</Text>
                        </Flex>
                      </Box>
                    )}

                    <Divider className="my-12" />

                    {/* Addresses */}
                    <Box>
                      <h2 className="mb-4">Addresses</h2>

                      {/* Pickup address */}
                      <Box mb="16px">
                        <h3 className="mb-5 mt-3">Pickup Information</h3>
                        <Grid templateColumns="repeat(10, 1fr)" gap={0}>
                          <GridItem colSpan={2}>
                            <h4 className="mt-3">Pickup depot</h4>
                          </GridItem>
                          {isAdmin ? (
                            <JobAddressesSection
                              isAdmin={isAdmin}
                              entityModel={job}
                              savedAddressesSelect={savedAddressesSelect}
                              defaultJobDestination={pickUpDestination}
                              onAddressSaved={() => {
                                getCustomerAddresses();
                              }}
                              jobDestinationChanged={(jobDestination) => {
                                setPickUpDestination({
                                  ...pickUpDestination,
                                  ...jobDestination,
                                  ...{ is_pickup: true },
                                });
                                // const selectedStateCode= jobDestination?.address_state=="Victoria"? "VIC" : jobDestination?.address_state=="Queensland"? "QLD" :"";
                                // setFilteredDepotOptions(depotOptions.filter((option) => option.label === selectedStateCode));
                                // console.log(depotOptions.filter((option) => option.label === selectedStateCode))
                                setJob({
                                  ...job,
                                  ...{
                                    pick_up_lng: jobDestination.lng,
                                    pick_up_lat: jobDestination.lat,
                                    pick_up_address: jobDestination.address,
                                    pick_up_notes: jobDestination.notes,
                                    pick_up_name: jobDestination.name,
                                    pick_up_report: jobDestination.report,
                                  },
                                });
                              }}
                            />
                          ) : (
                            <GridItem colSpan={7}>
                              <Flex
                                alignItems="center"
                                justifyContent="space-between"
                                width="100%"
                                className="py-0"
                              >
                                <p className="py-3 text-sm">
                                  {pickUpDestination.address}
                                </p>
                              </Flex>
                            </GridItem>
                          )}
                        </Grid>
                      </Box>

                      <Divider className="my-6" />

                      {/* Delivery Information */}
                      <Box mb="16px">
                        <h3 className="mb-5 mt-3">Delivery Information</h3>
                        {/* foreach jobDestinations */}
                        {jobDestinations.map((jobDestination, index) => {
                          return (
                            <Box key={jobDestination.id}>
                              <Grid templateColumns="repeat(10, 1fr)" gap={4}>
                                <GridItem colSpan={2}>
                                  <h4 className="mt-3">
                                    Delivery Address {index + 1}
                                  </h4>
                                </GridItem>
                                {isAdmin ? (
                                  <JobAddressesSection
                                    isAdmin={isAdmin}
                                    entityModel={job}
                                    savedAddressesSelect={savedAddressesSelect}
                                    defaultJobDestination={jobDestination}
                                    jobDestinationChanged={(jobDestination) => {
                                      handleJobDestinationChanged(
                                        jobDestination,
                                        index,
                                      );
                                    }}
                                    onAddressSaved={() => {
                                      getCustomerAddresses();
                                    }}
                                  />
                                ) : (
                                  <GridItem colSpan={7}>
                                    <Flex
                                      alignItems="center"
                                      justifyContent="space-between"
                                      width="100%"
                                      className="py-0"
                                    >
                                      <p className="py-3 text-sm">
                                        {jobDestination.address}
                                      </p>
                                    </Flex>
                                  </GridItem>
                                )}

                                <GridItem>
                                  <Flex>
                                    {/* if index == 0 */}
                                    {jobDestinations.length > 1 && isAdmin && (
                                      <Button
                                        bg="white"
                                        className="!text-[var(--chakra-colors-black-400)] mt-[3px] !py-3 !px-1 !h-[unset]"
                                        onClick={() => {
                                          handleRemoveFromJobDestinations(
                                            index,
                                          );
                                        }}
                                      >
                                        <FontAwesomeIcon
                                          icon={faTrashCan}
                                          className="!text-[var(--chakra-colors-black-400)]"
                                        />
                                      </Button>
                                    )}
                                  </Flex>
                                </GridItem>
                              </Grid>
                              <Divider className="my-6" />
                            </Box>
                          );
                        })}
                      </Box>

                      {isAdmin && (
                        <Box mb="16px">
                          <Flex alignItems="center" mb="16px" mt={5}>
                            <Button
                              variant="secondary"
                              onClick={() => {
                                addToJobDestinations();
                              }}
                            >
                              + Add delivery location
                            </Button>
                          </Flex>
                          <Divider className="my-12" />
                        </Box>
                      )}
                    </Box>

                    {/* Items */}
                    <Box mb="16px" mt={4}>
                      <Flex justify="space-between" align="center" mb="37px">
                        <h3 className="">Items</h3>
                        <Button
                          hidden={!isAdmin}
                          variant="secondary"
                          onClick={() => {
                            addToJobItems();
                          }}
                        >
                          + Add item
                        </Button>
                      </Flex>
                      {isAdmin ? (
                        <Box>
                          <JobInputTable
                            columns={itemsTableColumns}
                            data={jobItems}
                            optionsSelect={itemTypes}
                            onRemoveClick={(index) => {
                              handleRemoveFromJobItems(index);
                            }}
                            onValueChanged={handleJobItemChanged}
                          />

                          {/* <Divider className="my-12" /> */}
                        </Box>
                      ) : (
                        <Table>
                          <Thead>
                            <Tr>
                              <Th>TYPE</Th>
                              <Th>DIMENSIONS (L,W,H)</Th>
                              <Th>QTY</Th>
                              <Th>WEIGHT</Th>
                              <Th>CBM</Th>
                            </Tr>
                          </Thead>
                          <Tbody
                            className="bg-white divide-y divide-gray-200"
                            style={{ height: "200px" }}
                          >
                            {jobItems.map((jobItem) => {
                              return (
                                <Tr key={jobItem.id}>
                                  <Td> {jobItem.item_type?.name}</Td>
                                  <Td>
                                    {(jobItem.dimension_height * 100).toFixed(
                                      2,
                                    )}
                                    cm x{" "}
                                    {(jobItem.dimension_width * 100).toFixed(2)}
                                    cm x{" "}
                                    {(jobItem.dimension_depth * 100).toFixed(2)}
                                    cm
                                  </Td>
                                  <Td> {jobItem.quantity}</Td>
                                  <Td> {jobItem.weight}kg</Td>
                                  <Td>{jobItem.volume.toFixed(2)}cbm</Td>
                                </Tr>
                              );
                            })}
                          </Tbody>
                        </Table>
                      )}
                      <Box
                        mt={4}
                        p={3}
                        borderWidth="1px"
                        borderColor="gray.200"
                        borderRadius="md"
                        backgroundColor="gray.50"
                      >
                        {/* CBM Auto */}
                        <Flex justify="flex-end" align="center" mb={2}>
                          <Text
                            fontSize="sm"
                            fontWeight="500"
                            color="gray.700"
                            pl={4}
                          >
                            CBM Auto&nbsp;:&nbsp;
                          </Text>
                          <Text
                            fontSize="sm"
                            fontWeight="600"
                            color="blue.600"
                            textAlign="right"
                            pr={4}
                          >
                            {quoteCalculationRes.cbm_auto}
                          </Text>
                        </Flex>

                        {/* Total Weight */}
                        <Flex justify="flex-end" align="center">
                          <Text
                            fontSize="sm"
                            fontWeight="500"
                            color="gray.700"
                            pl={4}
                          >
                            Total Weight&nbsp;:&nbsp;
                          </Text>
                          <Text
                            fontSize="sm"
                            fontWeight="600"
                            color="blue.600"
                            textAlign="right"
                            pr={4}
                          >
                            {quoteCalculationRes.total_weight}
                          </Text>
                        </Flex>
                      </Box>
                    </Box>

                    {/* Attachments */}
                    <Divider />
                    <Box>
                      <h3 className="mb-6">Attachments</h3>
                      {isAdmin && (
                        <Flex width="100%" className="mb-6">
                          <FileInput
                            entity="Job"
                            entityId={job.id}
                            onUpload={() => {
                              getJob();
                              setUpdatingMedia(true);
                            }}
                            description="Browse or drop your files here to upload"
                            height="80px"
                            bg="primary.100"
                          ></FileInput>
                        </Flex>
                      )}

                      {/* foreach jobAttachments */}
                      {!jobLoading && job?.media.length >= 0 && (
                        <PaginationTable
                          columns={attachmentColumns}
                          data={job.media}
                          showDelete={isAdmin}
                          onDelete={(mediaId) => {
                            handleDeleteMedia({
                              variables: {
                                id: mediaId,
                              },
                            });
                          }}
                        />
                      )}
                    </Box>

                    <Divider className="my-12" />

                    {/* Additional Info */}
                    <Box mb="16px">
                      <h3 className="mb-5">Additional Info</h3>
                      {isAdmin ? (
                        <Box mb="16px">
                          <CustomInputField
                            label="Customer Notes"
                            placeholder=""
                            extra="Visible to driver"
                            isTextArea={true}
                            name="customer_notes"
                            value={job.customer_notes}
                            onChange={(e) =>
                              setJob({
                                ...job,
                                [e.target.name]: e.target.value,
                              })
                            }
                          />
                          <CustomInputField
                            isTextArea={true}
                            label="Base notes"
                            placeholder=""
                            name="base_notes"
                            value={job.base_notes}
                            onChange={(e) =>
                              setJob({
                                ...job,
                                [e.target.name]: e.target.value,
                              })
                            }
                          />

                          {/* <Text fontSize="sm" color={textColorSecodary} mt={3}>
                            <strong>Hint: </strong>To get a quote, the location
                            must be <strong>Victoria or Queensland</strong>, and
                            the job category should be{" "}
                            <strong>Air Freight or LCL</strong>.
                          </Text> */}
                        </Box>
                      ) : (
                        <Flex alignItems="center" mb={"16px"}>
                          <SimpleGrid width="200px" columns={{ sm: 1 }}>
                            <GridItem>
                              <Text fontSize="sm">Customer Notes</Text>
                            </GridItem>
                            <GridItem>
                              <Text fontSize="xs" color={textColorSecodary}>
                                Visible to driver
                              </Text>
                            </GridItem>
                          </SimpleGrid>
                          <Text fontSize="sm" width={"50%"}>
                            {job.customer_notes}
                          </Text>
                        </Flex>
                      )}
                      <Box mb="16px">
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <Box>
                            <Flex alignItems="center" width="100%" pt={7}>
                              <SimpleGrid columns={{ sm: 1 }} width="100%">
                                <GridItem>
                                  <FormLabel
                                    display="flex"
                                    mb="0"
                                    fontSize="sm"
                                    fontWeight="500"
                                    _hover={{ cursor: "pointer" }}
                                  >
                                    Does this job require a timeslot booking
                                    through Inbound Connect?
                                  </FormLabel>
                                </GridItem>
                                <GridItem>
                                  <RadioGroup
                                    isDisabled={!isAdmin}
                                    value={job.is_inbound_connect ? "1" : "0"}
                                    onChange={(e) => {
                                      setJob({
                                        ...job,
                                        is_inbound_connect:
                                          e === "1" ? true : false,
                                      });
                                      const selectedStateCode = job.pick_up_state == 'Victoria' ? 'VIC' : 
                         job.pick_up_state == 'Queensland' ? 'QLD' : '';
                                      const filtereddepotOption =
                                      depotOptions.filter(
                                        (option) => option.state_code == selectedStateCode
                                      );
                                    console.log(
                                      filtereddepotOption,job.pick_up_state,
                                      "filtereddepotOption",
                                    );
                                    setFilteredDepotOptions(filtereddepotOption);
                                    }}
                                  >
                                    <Stack direction="row" pt={3}>
                                      <Radio value="0">No</Radio>
                                      <Radio value="1" pl={6}>
                                        Yes
                                      </Radio>
                                    </Stack>
                                  </RadioGroup>
                                </GridItem>
                              </SimpleGrid>
                            </Flex>

                            {job.job_category_id == 1 &&
                              job.is_inbound_connect == true && (
                                <Box>
                                  <CustomInputField
                                    isSelect={true}
                                    optionsArray={filtereddepotOptions} // Use the state directly
                                    label="Timeslot depots:"
                                    value={
                                      filtereddepotOptions.find(
                                        (option) =>
                                          option.value === job.timeslot_depots,
                                      ) || null
                                    }
                                    placeholder="Select a depot"
                                    onChange={(e) => {
                                      setSelectedDepot(e.value);
                                      setRefinedData((prevData) => ({
                                        ...prevData,
                                        timeslot_depots: e.value,
                                      })); // Update the selected depot directly
                                     console.log("Selected depot: ", e.value)
                                      setJob({
                                        ...job,
                                        timeslot_depots: e.value, // Update job.timeslot_depots
                                      });
                                    }}
                                  />
                                </Box>
                              )}

                            <Flex alignItems="center" width="100%" pt={7}>
                              <SimpleGrid columns={{ sm: 1 }} width="100%">
                                <GridItem>
                                  <FormLabel
                                    display="flex"
                                    mb="0"
                                    fontSize="sm"
                                    fontWeight="500"
                                    _hover={{ cursor: "pointer" }}
                                  >
                                    Does this job require hand unloading?
                                  </FormLabel>
                                </GridItem>
                                <GridItem>
                                  <RadioGroup
                                    isDisabled={!isAdmin}
                                    value={job.is_hand_unloading ? "1" : "0"}
                                    onChange={(e) => {
                                      setJob({
                                        ...job,
                                        is_hand_unloading:
                                          e === "1" ? true : false,
                                      });
                                    }}
                                  >
                                    <Stack direction="row" pt={3}>
                                      <Radio value="0">No</Radio>
                                      <Radio value="1" pl={6}>
                                        Yes
                                      </Radio>
                                    </Stack>
                                  </RadioGroup>
                                </GridItem>
                              </SimpleGrid>
                            </Flex>

                            <Flex alignItems="center" width="100%" pt={7}>
                              <SimpleGrid columns={{ sm: 1 }} width="100%">
                                <GridItem>
                                  <FormLabel
                                    display="flex"
                                    mb="0"
                                    fontSize="sm"
                                    fontWeight="500"
                                    _hover={{ cursor: "pointer" }}
                                  >
                                    Are there dangerous goods being transported?
                                  </FormLabel>
                                </GridItem>
                                <GridItem>
                                  <RadioGroup
                                    isDisabled={!isAdmin}
                                    value={job.is_dangerous_goods ? "1" : "0"}
                                    onChange={(e) => {
                                      setJob({
                                        ...job,
                                        is_dangerous_goods:
                                          e === "1" ? true : false,
                                      });
                                    }}
                                  >
                                    <Stack direction="row" pt={3}>
                                      <Radio value="0">No</Radio>
                                      <Radio value="1" pl={6}>
                                        Yes
                                      </Radio>
                                    </Stack>
                                  </RadioGroup>
                                </GridItem>
                              </SimpleGrid>
                            </Flex>

                            <Flex alignItems="center" width="100%" pt={7}>
                              <SimpleGrid columns={{ sm: 1 }} width="100%">
                                <GridItem>
                                  <FormLabel
                                    display="flex"
                                    mb="0"
                                    fontSize="sm"
                                    fontWeight="500"
                                    _hover={{ cursor: "pointer" }}
                                  >
                                    Is a Tail Lift vehicle required?
                                  </FormLabel>
                                </GridItem>
                                <GridItem>
                                  <RadioGroup
                                    isDisabled={!isAdmin}
                                    value={job.is_tailgate_required ? "1" : "0"}
                                    onChange={(e) => {
                                      setJob({
                                        ...job,
                                        is_tailgate_required:
                                          e === "1" ? true : false,
                                      });
                                    }}
                                  >
                                    <Stack direction="row" pt={3}>
                                      <Radio value="0">No</Radio>
                                      <Radio value="1" pl={6}>
                                        Yes
                                      </Radio>
                                    </Stack>
                                  </RadioGroup>
                                </GridItem>
                              </SimpleGrid>
                            </Flex>
                          </Box>
                          <Box>
                            {/* Right side content goes here */}
                            <GridItem pr={4}>
                              {/* {(job.job_category_id == 1 ||
                                job.job_category_id == 2) &&
                                (job.transport_location === "VIC" ||
                                  job.transport_location === "QLD") && ( */}
                              <Flex
                                height="100%"
                                justifyContent="center"
                                pt={7}
                                flexDirection="column"
                              >
                                {/* First Row: Button */}
                                <Flex justify="center">
                                  <Button
                                    bg="#3b82f6" /* Match the blue color */
                                    color="white"
                                    _hover={{
                                      bg: "#2563eb", // Slightly darker blue for hover
                                    }}
                                    _active={{
                                      bg: "#2563eb", // Active state
                                      transform: "scale(0.95)", // Slightly shrink button when activated
                                    }}
                                    borderRadius="8px" /* Rounded corners */
                                    px={6}
                                    py={3}
                                    fontWeight="500"
                                    fontSize="sm"
                                    onClick={() => {
                                      handleSaveJobPriceCalculation();
                                    }}
                                  >
                                    {buttonText}
                                  </Button>
                                </Flex>

                                {/* Second Row: Other Elements */}
                                {quoteCalculationRes && (
                                  <Box mt={4}>
                                    <Stack spacing={3}>
                                      {/* Freight */}
                                      <Flex
                                        justify="space-between"
                                        align="center"
                                      >
                                        <Text
                                          fontSize="sm"
                                          fontWeight="500"
                                          color="gray.700"
                                          pr={2}
                                        >
                                          Freight:
                                        </Text>
                                        <Text
                                          fontSize="sm"
                                          fontWeight="600"
                                          color="blue.600"
                                        >
                                          {quoteCalculationRes.freight}
                                        </Text>
                                      </Flex>

                                      {/* Fuel */}
                                      <Flex
                                        justify="space-between"
                                        align="center"
                                      >
                                        <Text
                                          fontSize="sm"
                                          fontWeight="500"
                                          color="gray.700"
                                          pr={2}
                                        >
                                          Fuel:
                                        </Text>
                                        <Text
                                          fontSize="sm"
                                          fontWeight="600"
                                          color="blue.600"
                                        >
                                          {quoteCalculationRes.fuel}
                                        </Text>
                                      </Flex>

                                      {/* Hand Unload */}
                                      <Flex
                                        justify="space-between"
                                        align="center"
                                      >
                                        <Text
                                          fontSize="sm"
                                          fontWeight="500"
                                          color="gray.700"
                                          pr={2}
                                        >
                                          Hand Unload:
                                        </Text>
                                        <Text
                                          fontSize="sm"
                                          fontWeight="600"
                                          color="blue.600"
                                        >
                                          {quoteCalculationRes.hand_unload}
                                        </Text>
                                      </Flex>

                                      {/* Time Slot */}
                                      <Flex
                                        justify="space-between"
                                        align="center"
                                      >
                                        <Text
                                          fontSize="sm"
                                          fontWeight="500"
                                          color="gray.700"
                                          pr={2}
                                        >
                                          Time Slot:
                                        </Text>
                                        <Text
                                          fontSize="sm"
                                          fontWeight="600"
                                          color="blue.600"
                                        >
                                          {quoteCalculationRes.time_slot}
                                        </Text>
                                      </Flex>

                                      {/* Dangerous Goods */}
                                      <Flex
                                        justify="space-between"
                                        align="center"
                                      >
                                        <Text
                                          fontSize="sm"
                                          fontWeight="500"
                                          color="gray.700"
                                          pr={2}
                                        >
                                          Dangerous Goods:
                                        </Text>
                                        <Text
                                          fontSize="sm"
                                          fontWeight="600"
                                          color="blue.600"
                                        >
                                          {quoteCalculationRes.dangerous_goods}
                                        </Text>
                                      </Flex>

                                      {/* Stackable */}
                                      <Flex
                                        justify="space-between"
                                        align="center"
                                      >
                                        <Text
                                          fontSize="sm"
                                          fontWeight="500"
                                          color="gray.700"
                                          pr={2}
                                        >
                                          Stackable:
                                        </Text>
                                        <Text
                                          fontSize="sm"
                                          fontWeight="600"
                                          color="blue.600"
                                        >
                                          {quoteCalculationRes.stackable}
                                        </Text>
                                      </Flex>

                                      {/* Total */}
                                      <Flex
                                        justify="space-between"
                                        align="center"
                                      >
                                        <Text
                                          fontSize="sm"
                                          fontWeight="500"
                                          color="gray.700"
                                          pr={2}
                                        >
                                          Total:
                                        </Text>
                                        <Text
                                          fontSize="sm"
                                          fontWeight="600"
                                          color="blue.600"
                                        >
                                          {quoteCalculationRes.total}
                                        </Text>
                                      </Flex>
                                    </Stack>
                                  </Box>
                                )}
                              </Flex>
                              {/* )} */}
                            </GridItem>
                          </Box>
                        </SimpleGrid>
                      </Box>
                    </Box>
                    {isAdmin && (
                      <Box>
                        <Divider className="mt-12 mb-6" />

                        <Flex alignItems="center" className="mb-8">
                          <AreYouSureAlert
                            onDelete={handleDeleteJob}
                          ></AreYouSureAlert>
                        </Flex>
                      </Box>
                    )}
                  </Box>
                )}
                {/* Job Details */}
                {tabId == 2 && <ReportsTab jobObject={job} />}
                {/* Message Log */}
                {tabId == 3 && <MessageLogTab jobObject={job} />}
                {/* Message Invoice */}
                {tabId == 4 && <InvoiceTab jobObject={job} />}
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default JobEdit;
