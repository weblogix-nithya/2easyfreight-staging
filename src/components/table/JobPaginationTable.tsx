// Updated PaginationTable to include driver header rows with details layout

// @ts-nocheck
import {
  Button,
  ButtonGroup,
  HStack,
  IconButton,
  Link,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  VStack,
  Box,
  Flex,
  Badge,
  Stack,
  Wrap,
} from "@chakra-ui/react";
import { faTrashAlt } from "@fortawesome/pro-light-svg-icons";
import { faDownload, faEye, faPen } from "@fortawesome/pro-regular-svg-icons";
import { faMessageLines } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select } from "chakra-react-select";
import { SortAlt } from "components/icons/Icons";
import {
  formatCurrency,
  formatDate,
  formatTimeUTCtoInput,
  formatToTimeDate,
  getRowBgColor,
} from "helpers/helper";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import {
  Column,
  PluginHook,
  TableOptions,
  usePagination,
  useRowSelect,
  useSortBy,
  useTable,
} from "react-table";

// ... Types remain unchanged

const PaginationTable = <T extends object>({
  columns,
  data,
  isServerSide = false,
  options,
  plugins = [],
  _showDelete = false,
  setQueryPageIndex,
  setQueryPageSize,
  onDelete,
  path,
  showPageSizeSelect = false,
  showManualPages = false,
  showRowSelection = false,
  isFilterRowSelected = false,
  setSelectedRow,
  isChecked,
  onSortingChange,
  restyleTable = false,
}: // autoResetSelectedRows= false,
PaginationTableProps<T>) => {
  const router = useRouter();
  // const [pageRows, setPageRows] = useState([]);

  const pageSizeOptions = [
    { value: 10, label: "10 / page" },
    { value: 30, label: "30 / page" },
    { value: 50, label: "50 / page" },
    { value: 100, label: "100 / page" },
    { value: 150, label: "150 / page" },
    { value: 200, label: "200 / page" },
  ];

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize, sortBy },
    selectedFlatRows,
    gotoPage,
    pageCount,
    toggleAllRowsSelected,
    // autoResetSelectedRows
  } = useTable<T>(
    {
      ...options,
      columns,
      data,
      autoResetSelectedRows: false,
    },
    useSortBy,
    usePagination,
    ...plugins,
    useRowSelect,
  );

  // useEffect(() => {
  //   console.log("Page rows changed:", pageRows.map((r) => r.original?.job?.name));
  // }, [pageRows]);

  useEffect(() => {
    if (isServerSide && setQueryPageIndex && setQueryPageSize) {
      setQueryPageIndex(pageIndex);
      setQueryPageSize(pageSize);
    }
  }, [isServerSide, pageIndex, pageSize, setQueryPageIndex, setQueryPageSize]);

  useEffect(() => {
    if (showRowSelection) {
      setSelectedRow(selectedFlatRows);
    }
  }, [page, showRowSelection, setSelectedRow, selectedFlatRows]);

  const pageRows = useMemo(() => {
    return isFilterRowSelected ? page.filter((row) => row.isSelected) : page;
  }, [page, isFilterRowSelected]);

  useEffect(() => {
    if (onSortingChange) onSortingChange(sortBy);
  }, [sortBy]);

  useEffect(() => {
    if (!isChecked) toggleAllRowsSelected(isChecked);
  }, [isChecked]);

  return (
    <VStack w="full" align="start" spacing={4}>
      <Table colorScheme="white" {...getTableProps()}>
        <Thead>
          {headerGroups.map((headerGroup, index) => (
            <Tr {...headerGroup.getHeaderGroupProps()} key={`header-${index}`}>
              {headerGroup.headers.map((column) => (
                <Th
                  {...column.getHeaderProps(
                    column.enableSorting
                      ? column.getSortByToggleProps()
                      : undefined,
                  )}
                  key={`column-${column.id || column.Header || index}`}
                >
                  {column.render("Header")}
                  {column.enableSorting && (
                    <span>
                      {column.isSorted ? (
                        column.isSortedDesc ? (
                          "↓"
                        ) : (
                          "↑"
                        )
                      ) : (
                        <SortAlt
                          size={16}
                          style={{ transform: "rotate(180deg)" }}
                        />
                      )}
                    </span>
                  )}
                </Th>
              ))}
            </Tr>
          ))}
        </Thead>
        <Tbody {...getTableBodyProps()}>
          {pageRows.map((row, index) => {
            // console.log(row, "row one");
            prepareRow(row);
            const status = row.original?.job?.job_status?.name;

            const driver = row.original.driver;
            const prevDriver = pageRows[index - 1]?.original?.driver;

            const shouldShowDriverHeader =
              !!driver?.full_name &&
              (!prevDriver?.full_name || driver?.id !== prevDriver?.id);

            return (
              <React.Fragment key={`driver-header-${index}`}>
                {shouldShowDriverHeader && (
                  <Tr>
                    <Td colSpan={columns.length} p={0}>
                      <Box
                        bg="gray.100"
                        px={6}
                        py={3}
                        borderTop="4px solid"
                        borderLeft="4px solid"
                        borderColor="#2F80ED"
                        borderRadius="md"
                        w="100%"
                      >
                        <VStack align="start" spacing={2}>
                          <Flex
                            wrap="wrap"
                            justify="space-between"
                            align="center"
                            gap={4}
                            w="full"
                          >
                            <Text fontWeight="bold">
                              Driver: {driver.full_name} — {driver.driver_no}
                            </Text>

                            <Stack direction="row" spacing={3} wrap="wrap">
                              <Badge colorScheme="purple" variant="subtle">
                                First Collection:{" "}
                                {formatToTimeDate(
                                  driver.first_job_start_at_today ??
                                    "2022-01-03 00:00:00",
                                )}
                              </Badge>
                              <Badge colorScheme="purple" variant="subtle">
                                Last Delivery:{" "}
                                {formatToTimeDate(
                                  driver.last_job_drop_at_today ??
                                    "2022-01-03 00:00:00",
                                )}
                              </Badge>
                              <Badge colorScheme="blue" variant="subtle">
                                CBM: {driver.cbm_summary_today ?? 0} /{" "}
                                {driver.no_max_volume ?? 0}
                              </Badge>
                              <Badge colorScheme="blue" variant="subtle">
                                Weight: {driver.weight_summary_today ?? 0} /{" "}
                                {driver.no_max_capacity ?? 0}
                              </Badge>
                              <Badge colorScheme="blue" variant="subtle">
                                Pallets: {driver.no_max_pallets ?? 0}
                              </Badge>
                            </Stack>
                          </Flex>

                          <Flex
                            wrap="wrap"
                            justify="space-between"
                            gap={4}
                            w="full"
                          >
                            <Badge colorScheme="red" variant="subtle">
                              Current Suburb: WIP
                            </Badge>
                            <Badge colorScheme="red" variant="subtle">
                              Mobile Number: {driver.phone_no ?? "-"}
                            </Badge>
                            <Badge colorScheme="red" variant="subtle">
                              Rego: {driver.registration_no ?? "-"}
                            </Badge>
                            <Badge colorScheme="red" variant="subtle">
                              TAILGATE: {driver.is_tailgated ? "Yes" : "No"}
                            </Badge>
                          </Flex>
                        </VStack>
                      </Box>
                    </Td>
                  </Tr>
                )}
                <Tr
                  {...row.getRowProps()}
                  key={`data-row-${row.id || idx}`}
                  bg={getRowBgColor(status)}
                >
                  {row.cells.map((cell) => (
                    <Td
                      key={`cell-${row.id}-${cell.column.id}`}
                      {...cell.getCellProps()}
                    >
                      {cell.render("Cell")}
                    </Td>
                  ))}
                </Tr>
              </React.Fragment>
            );
          })}
        </Tbody>
      </Table>

      {/* Pagination Controls */}
      <HStack w="full" justify="space-between">
        {!isFilterRowSelected && showPageSizeSelect && (
          <Select
            isSearchable={false}
            size="sm"
            maxW="70px"
            value={pageSizeOptions.find((option) => option.value == pageSize)}
            onChange={(e) => setPageSize(Number(e.value))}
            options={pageSizeOptions}
            classNamePrefix="chakra-react-select"
            menuPosition="fixed"
          />
        )}

        {!isFilterRowSelected && (
          <>
            <Text>
              Showing {pageIndex * pageSize + 1} to {(pageIndex + 1) * pageSize}{" "}
              of {data.length} entries
            </Text>
            <ButtonGroup isAttached variant="outline">
              <IconButton
                aria-label="Go to previous page"
                icon={<HiChevronLeft />}
                isDisabled={!canPreviousPage}
                onClick={() => previousPage()}
              />
              <IconButton
                aria-label="Go to next page"
                icon={<HiChevronRight />}
                isDisabled={!canNextPage}
                onClick={() => nextPage()}
              />
            </ButtonGroup>
          </>
        )}
      </HStack>
    </VStack>
  );
};

export default PaginationTable;
