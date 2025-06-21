import { Box, Spinner } from "@chakra-ui/react"
import PaginationTable from "components/table/PaginationTable"
import type { Job } from 'graphql/job';

interface JobTableWrapperProps {
  isAdmin: boolean
  loading: boolean
  jobs: Job[]
  paginatorInfo: { lastPage: number }
  adminColumns: any[]
  companyColumns: any[]
  queryPageIndex: number
  queryPageSize: number
  sorting: { id: string; direction: boolean }
  setQueryPageIndex: React.Dispatch<React.SetStateAction<number>>
  setQueryPageSize: React.Dispatch<React.SetStateAction<number>>  
  setSelectedJobs: (rows: any[]) => void
  isShowSelectedOnly: boolean
  isChecked: boolean
  onSortingChange: (sort: any[]) => void
  restyleTable?: boolean
}

const JobTableWrapper = ({
  isAdmin,
  loading,
  jobs,
  paginatorInfo,
  adminColumns,
  companyColumns,
  queryPageIndex,
  queryPageSize,
  sorting,
  setQueryPageIndex,
  setQueryPageSize,
  setSelectedJobs,
  isShowSelectedOnly,
  isChecked,
  onSortingChange,
  restyleTable
}: JobTableWrapperProps) => {
  if (loading) {
    return (
      <Box textAlign="center" py={4} px={10}>
        Loading <Spinner size="sm" ml={2} />
      </Box>
    )
  }

  return (
    <PaginationTable
      columns={isAdmin ? adminColumns : companyColumns}
      data={jobs}
      options={{
        manualSortBy: true,
        initialState: {
          pageIndex: queryPageIndex,
          pageSize: queryPageSize,
          sortBy: [{ id: sorting?.id, desc: sorting?.direction }],
        },
        manualPagination: true,
        pageCount: paginatorInfo.lastPage,
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
      onSortingChange={onSortingChange}
      restyleTable={restyleTable}
      getRowProps={(row) => ({
        style: { cursor: "pointer" },
        bg:
          row.original?.job_status?.id === 1
            ? "yellow.50"
            : [6, 7].includes(Number(row.original?.job_status?.id))
            ? "green.50"
            : "white",
        _hover: { bg: "gray.100" },
      })}
    />
  )
}

export default JobTableWrapper
