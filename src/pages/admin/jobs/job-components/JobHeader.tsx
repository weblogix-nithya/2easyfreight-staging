import { SettingsIcon } from "@chakra-ui/icons";
import {
  Button,
  Checkbox,
  Flex,
  Link,
  useColorModeValue,
} from "@chakra-ui/react";
import { FullChevronDown } from "components/icons/Icons";
import { SearchBar } from "components/navbar/searchBar/SearchBar";
import { FaFileExcel } from "react-icons/fa";
import NextLink from "next/link";

interface JobHeaderProps {
  isAdmin: boolean;
  isCompany: boolean;
  onOpenSetting: () => void;
  onOpenFilter: () => void;
  isFilterTicked: string;
  handleExport: () => void;
  debouncedSearch: (query: string) => void;
  onToggleFilterCheckbox: (checked: boolean) => void;
}

const JobHeader = ({
  isAdmin,
  isCompany,
  onOpenSetting,
  onOpenFilter,
  isFilterTicked,
  handleExport,
  debouncedSearch,
  onToggleFilterCheckbox,
}: JobHeaderProps) => {
  const menuBg = useColorModeValue("white", "navy.800");

  return (
    <>
      <Flex justifyContent="space-between" alignItems="center">
        <h1>Delivery Jobs</h1>
        {isAdmin && (
          <Button variant="no-effects" onClick={onOpenSetting}>
            <SettingsIcon className="mr-2" />
            Settings
          </Button>
        )}
      </Flex>

      <Flex justifyContent="space-between" alignItems="center" mt={4}>
        <Flex alignItems="center">
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
                id="filter-toggle"
                name="filter-toggle"
                onChange={(e) => onToggleFilterCheckbox(e.target.checked)}
                isChecked={isFilterTicked === "1"}
              />
            </>
          )}
        </Flex>

        <Flex>
          <Button
            as={NextLink}
            href="/admin/jobs/create"
            variant="primary"
            className="mr-2"
          >
            {isCompany ? "New booking" : "Create job"}
          </Button>

          <Button
            leftIcon={<FaFileExcel />}
            variant="primary"
            onClick={handleExport}
          >
            Export Xls
          </Button>
        </Flex>
      </Flex>
    </>
  );
};

export default JobHeader;
