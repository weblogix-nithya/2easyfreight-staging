import { Box, Flex } from "@chakra-ui/react";
import DateRangePicker from "@wojtekmaj/react-daterange-picker";
import { Select } from "chakra-react-select";

interface StatusOption {
  value: string;
  label: string;
  statusIds: number[];
}

interface Props {
  statusOptions: StatusOption[];
  onStatusChange: (option: StatusOption) => void;
  rangeDate: [Date, Date] | null;
  setRangeDate: (range: [Date, Date] | null) => void;
}

const JobStatusDateFilter = ({
  statusOptions,
  onStatusChange,
  rangeDate,
  setRangeDate,
}: Props) => {
  return (
    <Flex>
      <Box width="300px">
        <Select
          options={statusOptions}
          // defaultValue={statusOptions[0]}
          defaultValue={statusOptions?.[0] ?? null}
          onChange={(value: any) => onStatusChange(value)}
          placeholder="Select Status"
          className="basic-single"
          classNamePrefix="select"
        />
      </Box>

      <Box
        alignItems="center"
        flexDirection="column"
        w="30%"
        maxW="max-content"
        p="10px 10px"
        h="max-content"
        ml="4"
        sx={{
          ".react-daterange-picker__wrapper": {
            border: "1px solid",
            borderColor: "#e3e3e3",
            padding: "6px",
            borderRadius: "0.375rem",
            marginTop: "-15px",
          },
        }}
      >
        {/* @ts-ignore */}
        <DateRangePicker
          value={rangeDate ?? undefined} // Use undefined if null
          onChange={(range) => {
            if (
              !range ||
              !Array.isArray(range) ||
              range.length !== 2 ||
              !range[0] ||
              !range[1]
            ) {
              setRangeDate(null);
            } else {
              setRangeDate(range as [Date, Date]);
            }
          }}
          clearIcon={<span style={{ color: "red", cursor: "pointer" }}>✕</span>}
        />
      </Box>
    </Flex>
  );
};

export default JobStatusDateFilter;
