// @ts-nocheck
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Flex,
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
} from "@chakra-ui/react";
import { faTrashAlt } from "@fortawesome/pro-light-svg-icons";
import { faDownload, faEye, faPen } from "@fortawesome/pro-regular-svg-icons";
import { faMessageLines } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select } from "chakra-react-select";
import { SortAlt } from "components/icons/Icons";
import { formatCurrency, formatDate, formatToTimeDate } from "helpers/helper";
import { useRouter } from "next/router";
import React, { useEffect, useState, useCallback, useMemo } from "react";
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

// ✅ DnD imports

import {
  DndContext,
  UniqueIdentifier,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

const EXCLUDED_IDS = new Set([
  "actions",
  "admin_notes",
  "timeslot",
  "job_destinations.address",
]);

const isInteractive = (el: HTMLElement | null): boolean =>
  !!el?.closest(
    'a,button,[role="button"],input,textarea,select,[contenteditable="true"],[data-no-row-toggle]',
  );

const getStatusStyle = (status: string) => {
  const st = status?.toLowerCase();
  if (st === "in transit") return { background: "#FFD580", color: "#8B4000" };
  if (st === "assigned") return { background: "#FFFACD", color: "#665c00" };
  if (["completed", "delivered"].includes(st))
    return { background: "#d4edda", color: "#155724" };
  if (["rejected", "cancelled"].includes(st))
    return { background: "#f8d7da", color: "#721c24" };
  return {};
};

export const SortableRow = ({ id, children }) => {
  const { setNodeRef, attributes, listeners, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
    display: "table-row",
  };

  return (
    <tr ref={setNodeRef} {...attributes} {...listeners} style={style}>
      {children}
    </tr>
  );
};

type PaginationTableProps<T extends object> = {
  columns: Column<T>[];
  data: T[];
  total: number;
  options?: Omit<TableOptions<T>, "data" | "columns">; // ✅ allows passing query + pagination options

  onReorder?: (reorderedRows: T[]) => void;
  autoSaveOnReorder?: boolean;
  isServerSide?: boolean;
  setQueryPageIndex?: React.Dispatch<React.SetStateAction<number>>;
  setQueryPageSize?: React.Dispatch<React.SetStateAction<number>>;
  showRowSelection?: boolean;
  setSelectedRow?: React.Dispatch<React.SetStateAction<any>>;
  isFilterRowSelected?: boolean;
  isChecked?: boolean;
  onSortingChange?: any;
  showPageSizeSelect?: boolean;
  restyleTable?: boolean;
  path?: string;
  onDelete?: (data: any) => void;
  onReorder?: (reorderedRows: T[]) => void; // already there
  onReorderChange?: (changed: boolean) => void; // ✅ NEW → fired when rows change
  autoSaveOnReorder?: boolean;
};

const PaginationTable = <T extends object>({
  columns,
  data,
  total,
  onReorder,
  onReorderChange,
  autoSaveOnReorder = false,
  options = {},
  isServerSide = false,
  setQueryPageIndex,
  setQueryPageSize,
  showRowSelection = false,
  setSelectedRow,
  isFilterRowSelected = false,
  isChecked,
  onSortingChange,
  showPageSizeSelect = false,
  restyleTable = false,
  path,
  onDelete,
}: PaginationTableProps<T>) => {
  const router = useRouter();
  const [pageRows, setPageRows] = useState<any[]>(data || []);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  useEffect(() => {
    setPageRows(data);
  }, [data]);

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
    toggleAllRowsSelected,
    getToggleAllRowsSelectedProps,
  } = useTable<T>(
    {
      ...options,
      columns,
      data: pageRows,
      autoResetSelectedRows: false,
    },
    useSortBy,
    usePagination,
    useRowSelect,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const getIndex = (id: UniqueIdentifier) =>
    page.findIndex((r) => r.original.job.id === id);

  const activeIndex = useMemo(
    () => (activeId && page ? getIndex(activeId) : -1),
    [activeId, page, getIndex],
  );

  // When pagination changes, notify parent
  useEffect(() => {
    if (isServerSide && setQueryPageIndex && setQueryPageSize) {
      setQueryPageIndex(pageIndex);
      setQueryPageSize(pageSize);
    }
  }, [isServerSide, pageIndex, pageSize]);

  // When sorting changes, notify parent
  useEffect(() => {
    if (onSortingChange) onSortingChange(sortBy);
  }, [sortBy]);

  useEffect(() => {
    if (showRowSelection && setSelectedRow) {
      setSelectedRow(selectedFlatRows);
    }
  }, [pageRows, showRowSelection, setSelectedRow, selectedFlatRows]);

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
            <Tr
              {...headerGroup.getHeaderGroupProps()}
              key={`header-row-${index}`}
            >
              {headerGroup.headers.map((column) => (
                <Th
                  {...column.getHeaderProps(
                    column.enableSorting
                      ? column.getSortByToggleProps()
                      : undefined,
                  )}
                  key={column.id}
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

        <DndContext
          sensors={sensors}
          onDragStart={({ active }) => console.log("drag start", active.id)}
          onDragEnd={({ active, over }) => {
            console.log("drag:", active.id, "→", over?.id);
            setActiveId(null);
            if (!over) return;

            setPageRows((prev) => {
              const oldIndex = prev.findIndex(
                (r) => String(r.job?.id) === String(active.id),
              );
              const newIndex = prev.findIndex(
                (r) => String(r.job?.id) === String(over.id),
              );
              if (oldIndex === -1 || newIndex === -1) return prev;

              const updated = arrayMove(prev, oldIndex, newIndex);
              onReorder?.(updated);
              onReorderChange?.(true);
              return [...updated];
            });
          }}
        >
          <SortableContext
            items={pageRows.map((r) => String(r.job?.id))}
            strategy={verticalListSortingStrategy}
          >
            <Tbody {...getTableBodyProps()}>
              {page.map((row, index) => {
                prepareRow(row);
                const { key, ...rowProps } = row.getRowProps();
                const status = row.original?.job?.job_status?.name;
                const driver = row.original.driver;
                const prevDriver = page[index - 1]?.original?.driver;
                const shouldShowDriverHeader =
                  !!driver?.full_name &&
                  (!prevDriver?.full_name || driver?.id !== prevDriver?.id);

                return (
                  <React.Fragment key={key}>
                    {shouldShowDriverHeader && (
                      <Tr>
                        <Td
                          colSpan={columns.length + (showRowSelection ? 1 : 0)}
                          p={0}
                        >
                          <Box
                            bg="#1d2d53"
                            color="#fff"
                            px={6}
                            py={3}
                            borderTop="4px solid"
                            borderLeft="4px solid"
                            borderColor="#2F80ED"
                            borderRadius="md"
                            w="100%"
                          >
                            <VStack align="start" spacing={3} w="full">
                              <Flex
                                direction="column"
                                align="start"
                                wrap="wrap"
                                gap={3}
                                w="full"
                              >
                                <Flex wrap="wrap" align="start" gap={3}>
                                  <Badge
                                    colorScheme="blue"
                                    variant="subtle"
                                    fontSize="md"
                                  >
                                    Driver: {driver.full_name} —{" "}
                                    {driver.driver_no}
                                  </Badge>
                                  <Badge
                                    colorScheme="purple"
                                    variant="subtle"
                                    fontSize="md"
                                  >
                                    First Collection:{" "}
                                    {formatToTimeDate(
                                      driver.first_job_start_at_today,
                                    )}
                                  </Badge>
                                  <Badge
                                    colorScheme="purple"
                                    variant="subtle"
                                    fontSize="md"
                                  >
                                    Last Delivery:{" "}
                                    {formatToTimeDate(
                                      driver.last_job_drop_at_today,
                                    )}
                                  </Badge>
                                </Flex>
                              </Flex>

                              <Flex wrap="wrap" align="start" gap={3} w="full">
                                <Badge
                                  colorScheme="red"
                                  variant="subtle"
                                  fontSize="md"
                                >
                                  Mobile: {driver.phone_no ?? "-"}
                                </Badge>
                                <Badge
                                  colorScheme="red"
                                  variant="subtle"
                                  fontSize="md"
                                >
                                  Rego: {driver.registration_no ?? "-"}
                                </Badge>
                                <Badge
                                  colorScheme="red"
                                  variant="subtle"
                                  fontSize="md"
                                >
                                  Tailgate: {driver.is_tailgated ? "Yes" : "No"}
                                </Badge>
                                <Badge
                                  colorScheme="blue"
                                  variant="subtle"
                                  fontSize="md"
                                >
                                  CBM: {driver.cbm_summary_today ?? 0} /{" "}
                                  {driver.no_max_volume ?? 0}
                                </Badge>
                                <Badge
                                  colorScheme="blue"
                                  variant="subtle"
                                  fontSize="md"
                                >
                                  Weight: {driver.weight_summary_today ?? 0} /{" "}
                                  {driver.no_max_capacity ?? 0}
                                </Badge>
                                <Badge
                                  colorScheme="blue"
                                  variant="subtle"
                                  fontSize="md"
                                >
                                  Pallets: {driver.no_max_pallets ?? 0}
                                </Badge>
                              </Flex>
                            </VStack>
                          </Box>
                        </Td>
                      </Tr>
                    )}

                    <SortableRow
                      id={String(row.original.job.id)}
                      key={row.original.job.id}
                    >
                      {row.cells.map((cell, i) => (
                        <Td key={i} style={getStatusStyle(status)}>
                          {cell.render("Cell")}
                        </Td>
                      ))}
                    </SortableRow>
                  </React.Fragment>
                );
              })}
            </Tbody>
          </SortableContext>
        </DndContext>
      </Table>

      {/* Pagination Controls */}
      <HStack w="full" justify="space-between">
        {showPageSizeSelect && (
          <Select
            isSearchable={false}
            size="sm"
            maxW="70px"
            onChange={(e) => setPageSize(Number(e.value))}
            options={[
              { value: 10, label: "10 / page" },
              { value: 30, label: "30 / page" },
              { value: 50, label: "50 / page" },
              { value: 100, label: "100 / page" },
            ]}
          />
        )}

        <Text>
          Showing {pageIndex * pageSize + 1} to {(pageIndex + 1) * pageSize} of{" "}
          {total} entries
        </Text>
        <ButtonGroup isAttached variant="outline">
          <IconButton
            aria-label="Previous"
            icon={<HiChevronLeft />}
            isDisabled={!canPreviousPage}
            onClick={() => previousPage()}
          />
          <IconButton
            aria-label="Next"
            icon={<HiChevronRight />}
            isDisabled={!canNextPage}
            onClick={() => nextPage()}
          />
        </ButtonGroup>
      </HStack>
    </VStack>
  );
};

export default PaginationTable;
