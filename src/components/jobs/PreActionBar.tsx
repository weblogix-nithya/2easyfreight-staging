import {
  Box,
  Button,
  Flex,
  FormLabel,
  HStack,
  Switch,
  Text,
} from "@chakra-ui/react";
import React, { useState } from "react";

type ActionBarProps = {
  selectedJobs: any[];
  onSwitch: (state: boolean) => void;
  hasChanges?: boolean;           // ✅ shows Save button when true
  onSaveChanges?: () => void;     // ✅ callback for Save button
};

const ActionBar = ({
  selectedJobs,
  onSwitch,
  hasChanges = false,
  onSaveChanges,
}: ActionBarProps) => {
  const [isSwitched, setIsSwitched] = useState<boolean>(false);

  const totals = selectedJobs.reduce(
    (acc, job) => {
      acc.totalWeights += job?.original?.job?.total_weight ?? 0;
      acc.totalCBM += job?.original?.job?.total_volume ?? 0;
      return acc;
    },
    { totalWeights: 0, totalCBM: 0 },
  );

  return (
    <HStack
      w="40%"
      minW="770px"
      position="fixed"
      bottom="5px"
      right="20px"
      bg="white"
      padding="10px"
      border="1px"
      borderColor="#E3E3E3"
      borderRadius="8px"
      boxShadow="0 2px 5px rgba(0, 0, 0, 0.1)"
      justify="space-between"
      left="50%"
      transform="translateX(-50%)"
      zIndex={100}
    >
      {/* Switch */}
      <Box w="65%" fontWeight="500">
        <Flex align="center" borderRadius="16px">
          <Switch
            id="show-selected"
            isChecked={isSwitched}
            onChange={() => {
              setIsSwitched(!isSwitched);
              onSwitch(!isSwitched);
            }}
          />
          <FormLabel htmlFor="show-selected" ms="15px" mb="0px">
            <Text fontSize="md" fontWeight="500">
              Show selected only
            </Text>
          </FormLabel>
        </Flex>
      </Box>

      {/* Totals */}
      <Box>
        <Text fontWeight="bold">
          Total Selected: {totals.totalWeights} kg,{" "}
          {totals.totalCBM.toFixed(2)} cbm
        </Text>
      </Box>

      {/* ✅ Save Changes Button */}
      {hasChanges && (
        <Box>
          <Button
            colorScheme="blue"
            px={5}
            py={1}
            onClick={onSaveChanges}
          >
            Save Changes
          </Button>
        </Box>
      )}
    </HStack>
  );
};

export default ActionBar;
