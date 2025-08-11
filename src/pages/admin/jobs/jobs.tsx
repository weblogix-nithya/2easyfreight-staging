import { useQuery } from "@apollo/client";
import {
  Box,
  SimpleGrid,
  Spinner,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import ActionBar from "components/jobs/ActionBar";
import {
  defaultJobFilter,
  defaultSelectedFilter,
  filterDisplayNames,
  SelectedFilter,
} from "components/jobs/Filters";
import {
  getBulkAssignColumns,
  getColumns,
  tableColumn,
} from "components/jobs/JobTableColumns";
import { getCompanyColumns } from "components/jobs/JobTableColumnsCustomer";
// import { SearchBar } from "components/navbar/searchBar/SearchBar";
import JobPaginationTable from "components/table/JobPaginationTable";
import PaginationTable from "components/table/PaginationTable";
import { GET_AVAILABLE_DRIVERS_QUERY } from "graphql/driver";
import {
  DynamicTableUser,
  GET_DYNAMIC_TABLE_USERS_QUERY,
} from "graphql/dynamicTableUser";
// import { GET_JOBS_QUERY, Job } from "graphql/job";
import { GET_JOBS_QUERY, GROUPED_PAGINATED_JOBS_QUERY } from "graphql/job";
import { GET_JOB_CATEGORIES_QUERY } from "graphql/jobCategories";
import { GET_JOB_STATUSES_QUERY } from "graphql/jobStatus";
import { JoinOnClause } from "graphql/types/types";
import {
  outputDynamicTableBody,
  outputDynamicTableHeader,
} from "helpers/helper";
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
import dynamic from "next/dynamic";
import { destroyCookie, parseCookies, setCookie } from "nookies";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { downloadExcel } from "react-export-table-to-excel";
// import { FaFileExcel } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  setIsFilterTicked,
  setJobFilters,
  setJobMainFilters,
} from "store/jobFilterSlice";
import { RootState } from "store/store";

import JobFiltersTagRow from "./job-components/JobFiltersTagRow";
import JobHeader from "./job-components/JobHeader";

const JobStatusDateFilter = dynamic(
  () => import("./job-components/JobStatusDateFilter"),
  {
    ssr: false,
  },
);
const FilterJobsModal = React.lazy(
  () => import("components/jobs/FilterJobsModal"),
);
const JobBulkAssignModal = React.lazy(
  () => import("components/jobs/JobBulkAssignModal"),
);
// const JobTableSettingsModal = React.lazy(
//   () => import("components/jobs/JobTableSettingsModal"),
// );
// Inside Job Index
const JobTableSettingsModal = dynamic(
  () => import("components/jobs/JobTableSettingsModal"),
  {
    loading: () => <Text>Loading settings...</Text>,
    ssr: false,
  },
);

const adminStatusOptions = [
  {
    value: "all",
    label: "Show All",
    statusIds: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    value: "current",
    label: "Current (Unassigned/Scheduled/En Route)",
    statusIds: [1, 2, 4],
  },
  {
    value: "in_transit",
    label: "In Transit (Assigned/In Transit)",
    statusIds: [3, 5],
  },
  {
    value: "completed",
    label: "Completed (Completed/Delivered)",
    statusIds: [6, 7],
  },
  // {
  //   value: "Cancelled",
  //   label: "Cancelled (Cancelled/Declined)",
  //   statusIds: [8, 9],
  // },
];

const companyStatusOptions = [
  {
    value: "all",
    label: "Show All",
    statusIds: [1, 2, 3, 4, 5, 6, 7],
  },
  {
    value: "Open",
    label: "Open",
    statusIds: [1],
  },
  {
    value: "Completed",
    label: "Completed",
    statusIds: [6, 7],
  },
];

function formatDate(date: Date, isStart: boolean): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const time = isStart ? "00:00:00" : "23:59:59";
  return `${year}-${month}-${day} ${time}`;
}

// export default function JobIndex() {
export default function JobIndex({}: // initialLoadOnly = false,
{
  // initialLoadOnly?: boolean;
}) {
  // const [hasInitialLoadDone, setHasInitialLoadDone] = useState(!initialLoadOnly);
  // const [initialJobsData, setInitialJobsData] = useState<any[]>([]);
  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(100);

  const [searchQuery, setSearchQuery] = useState("");
  const [sorting, setSorting] = useState<any>({ id: "id", direction: true });
  const [_statusFilter, setStatusFilter] = useState("all");
  const today = new Date();
  const [rangeDate, setRangeDate] = useState<[Date, Date]>([today, today]);
  const [_isTableLoading, setIsTableLoading] = useState(false);
  const {
    isAdmin,
    companyId,
    customerId,
    isCompany,
    isCompanyAdmin,
    isCustomer,
    userId,
  } = useSelector((state: RootState) => state.user);
  const statusOptions = useMemo(
    () => (isCompany ? companyStatusOptions : adminStatusOptions),
    [isCompany],
  );

  const [selectedStatus, setSelectedStatus] = useState<
    (typeof statusOptions)[number] | null
  >(statusOptions[0]);

  const { filters, displayName, jobMainFilters, is_filter_ticked } =
    useSelector((state: RootState) => state.jobFilter);
  const _cookies = parseCookies();
  const dispatch = useDispatch();
  const [withMedia, setWithMedia] = useState(false);
  const [jobStatuses, setJobStatuses] = useState([]);
  const [jobCategories, setJobCategories] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  // const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverOptions, setDriverOptions] = useState([]);
  const [dynamicTableUsers, setDynamicTableUsers] = useState<
    DynamicTableUser[]
  >([]);
  const [isShowSelectedOnly, setIsShowSelectedOnly] = useState(false);
  const [isChecked, setIsChecked] = useState(true);
  const [jobFilter, setJobFilter] = useState(defaultJobFilter);
  const [mainJobFilter, setMainJobFilter] = useState(null);
  const [mainFilters, setMainFilters] = useState<any>(defaultSelectedFilter);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilter>(
    defaultSelectedFilter,
  );
  const [mainFilterDisplayNames, setMainFilterDisplayNames] =
    useState<typeof filterDisplayNames>(filterDisplayNames);
  const [companyColumns, setCompanyColumns] = useState([]); // State for company columns

  const handleToggleWithMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWithMedia(e.target.checked); // Update state when checkbox is toggled
  };
  // const columns = useMemo(
  //   () => getColumns(isAdmin, isCustomer, withMedia, dynamicTableUsers),
  //   [isCustomer, isAdmin, dynamicTableUsers, withMedia],
  // );

  const { refetch: getDynamicTableUsers, data: dynamicTableData } = useQuery(
    GET_DYNAMIC_TABLE_USERS_QUERY,
    {
      variables: {
        query: "",
        page: 1,
        first: 100,
        orderByColumn: "sort_id",
        orderByOrder: "ASC",
        user_id: userId,
      },
      notifyOnNetworkStatusChange: true,
      onCompleted: (data) => {
        setDynamicTableUsers(
          data.dynamicTableUsers.data.filter(
            (item: DynamicTableUser) => item.is_active == true,
          ),
        );
      },
    },
  );

  const adminColumns = useMemo(() => {
    return getColumns(
      isAdmin,
      isCustomer,
      withMedia,
      dynamicTableData?.dynamicTableUsers?.data || [],
    );
  }, [dynamicTableData, isAdmin, isCustomer, withMedia]);

  // const companyColumns = getCompanyColumns(isAdmin, isCustomer, withMedia);
  useEffect(() => {
    // Recalculate the columns whenever withMedia changes
    const columns = getCompanyColumns(isAdmin, isCustomer, withMedia);
    setCompanyColumns(columns); // Set the new columns for company
    // console.log("Company Columns:", columns); // Debugging output to track columns
  }, [withMedia, isAdmin, isCustomer]);
  // const companyColumns = columns.filter((column) =>
  //   [
  //     "name",
  //     "company.name",
  //     "reference_no",
  //     "job_category.name",
  //     "job_type.name",
  //     "job_status.name",
  //     "ready_at",
  //     "pick_up_destination.address_formatted",
  //     // 'pick_up_destination.address_business_name',
  //     "job_destinations.address",
  //     // 'job_destinations.address_business_name',
  //     "actions",
  //   ].includes(column.id),
  // );

  const bulkAssignColumns = getBulkAssignColumns(
    isAdmin,
    isCustomer,
    dynamicTableUsers,
  );

  const orderByRelationship = useMemo(() => {
    let join = undefined as JoinOnClause;
    let column = sorting?.id ?? "id";
    let order = sorting?.direction ? "DESC" : "ASC";
    let table_name = "jobs";
    // let scope = undefined;
    if (column.includes("driver")) {
      join = {
        name: "drivers",
        table_name: "drivers",
        key: "id",
        other_key: "driver_id",
        other_table_name: "jobs",
      };
      table_name = "drivers";
      column = "full_name";
    }
    return [
      {
        join: join ? [join] : undefined,
        column,
        order,
        table_name,
        // scope,
      },
    ];
  }, [sorting]);

  const {
    data: groupedJobs,
    loading: loadingGroupedJobs,
    refetch: refetchGroupedJobs,
  } = useQuery(GROUPED_PAGINATED_JOBS_QUERY, {
    variables: {
      page: queryPageIndex + 1,
      per_page: queryPageSize,
      query: searchQuery || "",
      job_status_ids: mainJobFilter?.job_status_ids || [1, 2, 3, 4, 5, 6, 7],
      company_id: isCompany ? parseInt(companyId) : undefined,
      customer_id:
        isCustomer && !isCompanyAdmin ? parseInt(customerId) : undefined,
      orderByRelationship: [
        {
          column: "id",
          order: "DESC",
          table_name: "jobs",
        },
      ],
      between_at: rangeDate?.[0]
        ? {
            from_at: formatDate(rangeDate[0], true),
            to_at: formatDate(rangeDate[1], false),
          }
        : undefined,
    },
    skip: !userId || !isAdmin,
    onCompleted: (_data) => {
      // console.log("groupedJobs =>", data.groupedPaginatedJobs.data);
    },
  });

  const _jobs = groupedJobs?.groupedPaginatedJobs;
  const loading = loadingGroupedJobs;
  const refetchJobs = refetchGroupedJobs;

  // useEffect(() => {
  //   if (groupedJobs?.groupedPaginatedJobs?.data?.length) {
  //     getJobStatuses();
  //     getJobCategories();
  //     getAvailableDrivers();
  //     getDynamicTableUsers();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [groupedJobs?.groupedPaginatedJobs?.data?.length]);

  const {
    loading: companyJobsLoading,
    error: _companyJobsError,
    data: companyJobs,
    refetch: getCompanyJobs,
  } = useQuery(GET_JOBS_QUERY, {
    variables: {
      query: searchQuery,
      page: queryPageIndex + 1,
      first: queryPageSize,
      orderByRelationship: orderByRelationship,
      company_id: isCompany ? parseInt(companyId) : undefined,
      customer_id:
        isCustomer && !isCompanyAdmin ? parseInt(customerId) : undefined,
      job_status_ids: mainJobFilter?.job_status_ids || [1, 2, 3, 4, 5, 6, 7],
      between_at: rangeDate?.[0]
        ? {
            from_at: formatDate(rangeDate[0], true),
            to_at: formatDate(rangeDate[1], false),
          }
        : undefined,
      ...mainJobFilter,
    },
    skip: !isCompany && !isCustomer,
  });

  useEffect(() => {
    const hasGroupedJobs = groupedJobs?.groupedPaginatedJobs?.data?.length > 0;
    const hasCompanyJobs = companyJobs?.jobs?.data?.length > 0;

    if ((isAdmin && hasGroupedJobs) || (!isAdmin && hasCompanyJobs)) {
      getJobStatuses();
      getJobCategories();
      getAvailableDrivers();
      getDynamicTableUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isAdmin,
    groupedJobs?.groupedPaginatedJobs?.data?.length,
    companyJobs?.jobs?.data?.length,
  ]);

  useEffect(() => {
    if (is_filter_ticked == "1") {
      let _jobFilter = jobFilter;
      const updatedValues: any = {};
      for (const key in defaultSelectedFilter) {
        if (
          filters[key as keyof SelectedFilter] !== undefined &&
          filters[key as keyof SelectedFilter] !== "undefined" &&
          filters[key as keyof SelectedFilter] !== ""
        ) {
          updatedValues[key] = filters[key as keyof SelectedFilter];
        }
      }

      setJobFilter(jobMainFilters);
      _jobFilter = jobMainFilters;
      if (displayName) setMainFilterDisplayNames(displayName);
      updateTags(updatedValues, _jobFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [is_filter_ticked]);

  const handleResetAll = () => {
    updateTags({ ...defaultSelectedFilter }, defaultJobFilter);
  };

  const updateTags = (updatedValues: SelectedFilter, jobFilter: any) => {
    const updatedJobFilter = { ...jobFilter };
    for (const key in defaultSelectedFilter) {
      if (
        updatedValues[key as keyof SelectedFilter] == undefined ||
        updatedValues[key as keyof SelectedFilter] == null ||
        updatedValues[key as keyof SelectedFilter].length == 0
      ) {
        delete updatedJobFilter[key as keyof SelectedFilter];
      }
      setCookie(
        null,
        `jobFilters_${key}`,
        JSON.stringify(updatedValues[key as keyof SelectedFilter]),
        {
          maxAge: 30 * 24 * 60 * 60,
          path: "*",
        },
      );
      dispatch(
        setJobFilters({
          key: key,
          value: updatedValues[key as keyof SelectedFilter],
        }),
      );
    }
    setCookie(null, `jobMainFilters`, JSON.stringify(updatedJobFilter), {
      maxAge: 30 * 24 * 60 * 60,
      path: "*",
    });
    dispatch(setJobMainFilters(updatedJobFilter));

    setJobFilter(updatedJobFilter);
    setMainJobFilter(updatedJobFilter);
    setSelectedFilters(updatedValues);
    setMainFilters(updatedValues);
  };
  const {
    isOpen: isOpenFilter,
    onOpen: onOpenFilter,
    onClose: onCloseFilter,
  } = useDisclosure();
  useEffect(() => {
    getJobStatuses();
    getJobCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    isOpen: isOpenSetting,
    onOpen: onOpenSetting,
    onClose: onCloseSetting,
  } = useDisclosure();

  const {
    isOpen: isOpenBulkAssign,
    onOpen: onOpenBulkAssign,
    onClose: onCloseBulkAssign,
  } = useDisclosure();

  // const changeTab = useMemo(() => {
  //   return debounce((tab) => {
  //     // setIsPending(tab == 1);
  //     // setIsCompleted(tab == 2 ? true : false);
  //     setQueryPageIndex(0);
  //   }, 300);
  // }, []);

  useEffect(() => {
    if (isAdmin) {
      refetchJobs(); // GROUPED_PAGINATED_JOBS_QUERY
    } else if (isCompany || isCustomer) {
      getCompanyJobs(); // GET_JOBS_QUERY
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    queryPageIndex,
    queryPageSize,
    searchQuery,
    mainFilters,
    rangeDate,
    withMedia,
    isAdmin,
    isCompany,
    isCustomer,
  ]);

  const debouncedSearch = useMemo(
    () =>
      debounce((query) => {
        setSearchQuery(query);
        setQueryPageIndex(0);
      }, 300),
    [],
  );

  useEffect(
    () => debouncedSearch.cancel(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const { refetch: getJobStatuses } = useQuery(GET_JOB_STATUSES_QUERY, {
    skip: true,
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setJobStatuses([]);
      setJobStatuses(
        data.jobStatuses.data.map((jobStatus: any) => ({
          value: parseInt(jobStatus.id),
          label: jobStatus.name,
        })),
      );
    },
  });

  const { refetch: getJobCategories } = useQuery(GET_JOB_CATEGORIES_QUERY, {
    skip: true,
    variables: {
      query: "",
      page: 1,
      first: 100,
      orderByColumn: "id",
      orderByOrder: "ASC",
    },
    onCompleted: (data) => {
      setJobCategories([]);
      data.jobCategorys.data.map((category: any) => {
        setJobCategories((jobCategories) => [
          ...jobCategories,
          {
            value: parseInt(category.id),
            label: category.name,
          },
        ]);
      });
    },
  });

  const { refetch: getAvailableDrivers } = useQuery(
    GET_AVAILABLE_DRIVERS_QUERY,
    {
      skip: true,
      variables: {
        query: "",
        page: 1,
        first: 500,
        orderByColumn: "id",
        orderByOrder: "ASC",
        available: true,
        // need to add in available drivers
      },
      notifyOnNetworkStatusChange: true,
      onCompleted: (data) => {
        setDriverOptions([]);
        setDrivers([]);
        data.drivers.data.map((driver: any) => {
          setDriverOptions((driverOptions) => [
            ...driverOptions,
            {
              value: parseInt(driver.id),
              label: driver.full_name,
              data: driver,
            },
          ]);
          setDrivers(data.drivers.data);
        });
      },
    },
  );

  const handleExport = () => {
    const header = outputDynamicTableHeader(dynamicTableUsers);
    const body = outputDynamicTableBody(
      dynamicTableUsers,
      tableColumn,
      selectedJobs,
    );
    downloadExcel({
      fileName: "react-export-table-to-excel.xls",
      sheet: "Delivery Jobs",
      tablePayload: {
        header,
        body: body,
      },
    });
  };
  const handleSortingChange = (sortBy: string | any[]) => {
    // console.log("handleSorting", sortBy);
    if (sortBy.length === 0) {
      setSorting({
        id: "id",
        direction: true,
      });
    } else {
      const [sort] = sortBy;
      const _newDirection = sort.desc ? "DESC" : "ASC";
      const newSorting = {
        id: sort.id,
        direction: sort.desc,
      };
      setSorting(newSorting);
    }
  };

  const handleStatusChange = (selectedOption: any) => {
    setSelectedStatus(selectedOption);
    setStatusFilter(selectedOption.value);
    setQueryPageIndex(0);

    // Update job status IDs filter based on selection
    let statusIds: number[] = [];
    if (selectedOption.value !== "all") {
      const option = statusOptions.find(
        (opt) => opt.value === selectedOption.value,
      );
      statusIds = option?.statusIds || [];
    }

    // Store the status IDs in state or update the existing filter
    const updatedJobFilter = {
      ...mainJobFilter,
      job_status_ids: statusIds.length > 0 ? statusIds : [1, 2, 3, 4, 5, 6, 7],
    };
    setMainJobFilter(updatedJobFilter);
  };

  useEffect(() => {
    setIsTableLoading(loading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    refetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeDate]);

  return (
    <AdminLayout>
      <Box pt={{ base: "130px", md: "97px", xl: "97px" }}>
        <SimpleGrid
          mb="70px"
          pt="32px"
          px="24px"
          columns={{ sm: 1 }}
          spacing={{ base: "20px", xl: "20px" }}
        >
          {/* <Flex
            minWidth="max-content"
            alignItems="center"
            justifyContent="space-between"
          >
            <h1>Delivery Jobs</h1>

            {isAdmin && (
              <Button variant="no-effects" onClick={onOpenSetting}>
                <SettingsIcon className="mr-2" />
                Settings
              </Button>
            )}
          </Flex>
          <Flex minWidth="max-content" justifyContent="space-between">
            <Flex>
              <SearchBar
                onChangeSearchQuery={debouncedSearch}
                placeholder="Search delivery jobs"
                background={menuBg}
                me="10px"
              />
              {isAdmin && (
                <>
                  <Button
                    variant="no-effects"
                    onClick={onOpenFilter}
                    className="text-[var(--chakra-colors-primary-400)]"
                  >
                    Filters
                    <FullChevronDown className="ml-2" />
                  </Button>
                  <Checkbox
                    onChange={(e) => {
                      if (!e.target.checked) {
                        destroyCookie(null, "jobMainFilters", { path: "*" });
                        destroyCookie(null, "displayName", { path: "*" });
                        handleResetAll();
                      }
                      setCookie(
                        null,
                        "is_filter_ticked",
                        e.target.checked ? "1" : "0",
                        {
                          maxAge: 30 * 24 * 60 * 60,
                          path: "*",
                        },
                      );
                      dispatch(setIsFilterTicked(e.target.checked ? "1" : "0"));
                    }}
                    isChecked={is_filter_ticked == "1" ? true : false}
                  ></Checkbox>
                </>
              )}
            </Flex>

            <Flex>
              <Link href="/admin/jobs/create">
                <Button variant="primary" className="mr-2">
                  {isCompany ? "New booking" : "Create job"}
                </Button>
              </Link>
              <Button
                leftIcon={<FaFileExcel />}
                variant="primary"
                onClick={handleExport}
              >
                Export Xls
              </Button>
            </Flex>
          </Flex> */}

          <JobHeader
            isAdmin={isAdmin}
            isCompany={isCompany}
            onOpenSetting={onOpenSetting}
            onOpenFilter={onOpenFilter}
            isFilterTicked={is_filter_ticked}
            handleExport={handleExport}
            debouncedSearch={debouncedSearch}
            onToggleFilterCheckbox={(checked) => {
              if (!checked) {
                destroyCookie(null, "jobMainFilters", { path: "*" });
                destroyCookie(null, "displayName", { path: "*" });
                handleResetAll();
              }
              setCookie(null, "is_filter_ticked", checked ? "1" : "0", {
                maxAge: 30 * 24 * 60 * 60,
                path: "*",
              });
              dispatch(setIsFilterTicked(checked ? "1" : "0"));
            }}
          />

          {/* <Flex alignItems="left" flexWrap={"wrap"}>
            {Object.keys(mainFilters).map((filterKey) => {
              if (mainFilters[filterKey]) {
                return (
                  <Tag
                    key={filterKey}
                    size={"md"}
                    borderRadius="full"
                    variant="solid"
                    bg={"black.100"}
                    color={"black"}
                  >
                    <TagLabel>
                      {mainFilterDisplayNames[filterKey as keyof SelectedFilter]
                        .label +
                        ":" +
                        mainFilterDisplayNames[
                          filterKey as keyof SelectedFilter
                        ].value}
                    </TagLabel>
                    <TagCloseButton
                      onClick={() => {
                        // Remove the filter when the tag is closed
                        const newSelectedFilters = { ...mainFilters };
                        delete newSelectedFilters[
                          filterKey as keyof SelectedFilter
                        ];
                        updateTags(newSelectedFilters, jobFilter);
                      }}
                    />
                  </Tag>
                );
              }
            })}
            <Button
              // onClick={clearJobFilters}
              className="!h-[30px] ml-2"
              variant="smallGreySquare"
              bg={"none"}
              onClick={() => handleResetAll()}
            >
              Clear all
            </Button>
          </Flex> */}
          <JobFiltersTagRow
            mainFilters={mainFilters}
            mainFilterDisplayNames={mainFilterDisplayNames}
            onClearAll={handleResetAll}
            onRemoveFilter={(key) => {
              const newSelectedFilters = { ...mainFilters };
              delete newSelectedFilters[key];
              updateTags(newSelectedFilters, jobFilter);
            }}
          />

          <JobStatusDateFilter
            statusOptions={statusOptions}
            onStatusChange={handleStatusChange}
            selectedStatus={selectedStatus}
            rangeDate={rangeDate}
            setRangeDate={setRangeDate}
            withMedia={withMedia}
            handleToggleWithMedia={handleToggleWithMedia}
          />

          {(isAdmin && loading) || (!isAdmin && companyJobsLoading) ? (
            <Box textAlign="center" py={4} px={10}>
              Loading <Spinner size="sm" ml={2} />
            </Box>
          ) : isAdmin ? (
            _jobs?.data?.length > 0 ? (
              <JobPaginationTable
                columns={adminColumns}
                data={_jobs?.data}
                total={_jobs?.total}
                options={{
                  manualSortBy: true,
                  initialState: {
                    pageIndex: queryPageIndex,
                    pageSize: queryPageSize,
                    sortBy: [{ id: sorting?.id, desc: sorting?.direction }],
                  },
                  manualPagination: true,
                  pageCount: _jobs?.last_page,
                }}
                setQueryPageIndex={setQueryPageIndex}
                setQueryPageSize={setQueryPageSize}
                isServerSide
                showPageSizeSelect
                showRowSelection
                setSelectedRow={setSelectedJobs}
                isFilterRowSelected={isShowSelectedOnly}
                isChecked={isChecked}
                showManualPages
                onSortingChange={handleSortingChange}
                restyleTable
              />
            ) : (
              <Box textAlign="center" py={4} px={10} color="gray.600">
                No records found.
              </Box>
            )
          ) : companyJobs?.jobs?.data?.length > 0 ? (
            <PaginationTable
              columns={companyColumns}
              data={companyJobs?.jobs?.data}
              options={{
                manualSortBy: true,
                initialState: {
                  pageIndex: queryPageIndex,
                  pageSize: queryPageSize,
                  sortBy: [{ id: sorting?.id, desc: sorting?.direction }],
                },
                manualPagination: true,
                pageCount: companyJobs?.jobs?.paginatorInfo?.lastPage,
              }}
              setQueryPageIndex={setQueryPageIndex}
              setQueryPageSize={setQueryPageSize}
              isServerSide
              showPageSizeSelect
              showRowSelection
              setSelectedRow={setSelectedJobs}
              isFilterRowSelected={isShowSelectedOnly}
              isChecked={isChecked}
              showManualPages
              onSortingChange={handleSortingChange}
            />
          ) : (
            <Box textAlign="center" py={4} px={10} color="gray.600">
              No records found.
            </Box>
          )}
        </SimpleGrid>

        {/* Floating Action Bar */}
        {isAdmin && !loading && (
          <ActionBar
            selectedJobs={selectedJobs}
            onSwitch={setIsShowSelectedOnly}
            onClickBulkAssign={onOpenBulkAssign}
          />
        )}
        <Suspense fallback={null}>
          {isOpenFilter && (
            <FilterJobsModal
              isOpen={isOpenFilter}
              onClose={onCloseFilter}
              jobStatuses={jobStatuses}
              jobCategories={jobCategories}
              onFilterApply={(selectedFilters, filterDisplayName) => {
                // Update the tags
                updateTags(selectedFilters, jobFilter);

                setMainFilterDisplayNames(filterDisplayName);
                setCookie(
                  null,
                  "displayName",
                  JSON.stringify(filterDisplayName),
                  {
                    maxAge: 30 * 24 * 60 * 60,
                    path: "*",
                  },
                );
              }}
              selectedFilters={selectedFilters}
              setSelectedFilters={setSelectedFilters}
              jobFilter={jobFilter}
              setJobFilter={setJobFilter}
              filterDisplayNames={mainFilterDisplayNames}
            />
          )}
        </Suspense>
        <Suspense fallback={null}>
          {isOpenSetting && (
            <JobTableSettingsModal
              isOpen={isOpenSetting}
              onClose={() => {
                onCloseSetting();
                // setSettingOpen(false);
                getDynamicTableUsers();
                refetchJobs(); // Optional: Refresh job data
              }}
            />
          )}
        </Suspense>
        <Suspense fallback={null}>
          {isOpenBulkAssign && (
            <JobBulkAssignModal
              isOpen={isOpenBulkAssign}
              onClose={onCloseBulkAssign}
              driverOptions={driverOptions}
              drivers={drivers}
              selectedJobs={selectedJobs}
              columns={bulkAssignColumns}
              setIsChecked={setIsChecked}
              setSelectedJobs={setSelectedJobs}
              refreshPage={() => refetchJobs()}
            />
          )}
        </Suspense>
      </Box>
    </AdminLayout>
  );
}
