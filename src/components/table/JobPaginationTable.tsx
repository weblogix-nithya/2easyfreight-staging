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
} from "@chakra-ui/react";
import { faTrashAlt } from "@fortawesome/pro-light-svg-icons";
import { faDownload, faEye, faPen } from "@fortawesome/pro-regular-svg-icons";
import { faMessageLines } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select } from "chakra-react-select";
import { SortAlt } from "components/icons/Icons";
import { formatCurrency, formatDate } from "helpers/helper";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
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
}: PaginationTableProps<T>) => {
  const router = useRouter();
  const [pageRows, setPageRows] = useState([]);

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
  } = useTable<T>(
    {
      ...options,
      columns,
      data,
    },
    useSortBy,
    usePagination,
    ...plugins,
    useRowSelect,
  );

  useEffect(() => {
    console.log("Page rows changed:", pageRows.map((r) => r.original?.job?.name));
  }, [pageRows]);
  
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
    setPageRows(
      isFilterRowSelected ? page.filter((row) => row.isSelected) : page,
    );
  }, [
    page,
    isFilterRowSelected,
    showRowSelection,
    setSelectedRow,
    selectedFlatRows,
  ]);

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
                  key={column.id || Math.random()}
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
            console.log(row,"row one")
            prepareRow(row);
            const currentDriver = row.original.driver;
            const prevDriver = pageRows[index - 1]?.original?.driver;

            const shouldShowDriverHeader =
              currentDriver &&
              (!prevDriver || currentDriver?.id !== prevDriver?.id);

            return (
              <React.Fragment key={index}>
                {shouldShowDriverHeader && (
                  <Tr bg="gray.50">
                    <Td colSpan={columns.length}>
                      <VStack align="start" spacing={3}>
                        {/* First Row: Driver Info & Stats */}
                        <Flex
                          justify="space-between"
                          align="center"
                          flexWrap="wrap"
                          w="full"
                          gap={3}
                        >
                          <Text fontWeight="bold">
                            Driver: {currentDriver.full_name} —{" "}
                            {currentDriver.driver_no}
                          </Text>                       

                          <Stack direction="row" spacing={3} flexWrap="wrap">
                            <Badge colorScheme="purple" variant="subtle">
                              First Collection: {currentDriver.first_job_start_at_today ?? '03/01/2022 00:00:00'}
                            </Badge>
                            <Badge colorScheme="purple" variant="subtle">
                              Last delivery: {currentDriver.last_job_drop_at_today ?? '03/01/2022 00:00:00'}
                            </Badge>
                            <Badge colorScheme="blue" variant="subtle">
                              CBM:{" "}
                              {`${currentDriver.cbm_summary_today ?? 0} / ${
                                currentDriver.no_max_volume ?? 0
                              }`}
                            </Badge>
                            <Badge colorScheme="blue" variant="subtle">
                              Weight:{" "}
                              {`${currentDriver.weight_summary_today ?? 0} / ${
                                currentDriver.no_max_capacity ?? 0
                              }`}
                            </Badge>
                            <Badge colorScheme="blue" variant="subtle">
                              Pallets: {currentDriver.no_max_pallets ?? 0}
                            </Badge>
                          
                          </Stack>
                        </Flex>

                        {/* Second Row: Mobile, Rego, Tailgate */}
                        <Flex
                          // justify="flex-start"
                          align="center"
                          flexWrap="wrap"
                          w="full"
                          gap={3}
                        >
                          <Badge colorScheme="red" variant="subtle">
                            Current suburb: WIP
                          </Badge>
                          <Badge colorScheme="red" variant="subtle">
                            Mobile Number: {currentDriver.mobile_no ?? "-"}
                          </Badge>
                          <Badge colorScheme="red" variant="subtle">
                            Rego: -
                          </Badge>
                          <Badge colorScheme="red" variant="subtle">
                            TAILGATE: { currentDriver.is_tailgated ? "Yes" : "No" }
                          </Badge>
                        </Flex>
                      </VStack>
                    </Td>
                  </Tr>
                )}
                <Tr {...row.getRowProps()}>
                  {row.cells.map((cell, i) => (
                    <Td {...cell.getCellProps()} key={i}>
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
