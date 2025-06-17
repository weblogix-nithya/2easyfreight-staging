// React and Next.js imports
// Apollo GraphQL imports
import { useMutation, useQuery } from "@apollo/client";
// Chakra UI imports
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Input,
  SimpleGrid,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
// Third-party library imports
import { Select } from "chakra-react-select";
// Local components imports
import AddressesModal from "components/addresses/AddressesModal";
import { showGraphQLErrorToast } from "components/toast/ToastError";
// Local GraphQL imports
import {
  CREATE_COMPANY_MUTATION,
  defaultCompany,
  paymentTerms,
} from "graphql/company";
import {
  CompanyRate,
  CREATE_COMPANY_RATE_MUTATION,
  GET_LIST_OF_SEAFREIGHTS,
} from "graphql/CompanyRate";
// Layout imports
import AdminLayout from "layouts/admin";
import { useRouter } from "next/router";
import { useState } from "react";

interface Seafreight {
  value: number;
  label: string;
  cbm_rate: number;
  min_charge: number;
  state: string;
}

interface GroupedSeafreights {
  [key: string]: Seafreight[];
}

function CompanyCreate() {
  const toast = useToast();
  const textColor = useColorModeValue("navy.700", "white");
  // //  const textColorSecondary = "gray.400";
  const [company, setCompany] = useState(defaultCompany);
  const router = useRouter();
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [groupedSeafreights, setGroupedSeafreights] =
    useState<GroupedSeafreights>({});
  const [stateOptions, setStateOptions] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [regionOption, setRegionOption] = useState([]);
  const [companyRates, setCompanyRates] = useState<CompanyRate[]>([
    {
      id: undefined,
      company_id: "",
      seafreight_id: null,
      area: "",
      cbm_rate: 0,
      minimum_charge: 0,
      state: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);
  const [createCompanyRate] = useMutation(CREATE_COMPANY_RATE_MUTATION);

  const [handleCreateCompany, {}] = useMutation(CREATE_COMPANY_MUTATION, {
    variables: {
      input: {
        name: company.name,
        abn: company.abn,
        contact_phone: company.contact_phone,
        contact_email: company.contact_email,
        account_email: company.account_email,
        address: company.address,
        address_business_name: company.address_business_name,
        address_line_1: company.address_line_1,
        address_line_2: company.address_line_2,
        address_city: company.address_city,
        address_postal_code: company.address_postal_code,
        address_state: company.address_state,
        address_country: company.address_country,
        lng: company.lng,
        lat: company.lat,
        lcl_rate: company.lcl_rate,
        rate_card_url: undefined,
        logo_url: undefined,
        payment_term: company.payment_term ?? "7_days",
      },
    },
    onCompleted: async (data) => {
      try {
        // Create rates for the new company
        const validRates = companyRates.filter(
          (rate) =>
            rate.seafreight_id &&
            rate.area &&
            rate.cbm_rate > 0 &&
            rate.minimum_charge > 0,
        );

        // console.log("validRates", validRates);

        for (const rate of validRates) {
          await createCompanyRate({
            variables: {
              company_id: Number(data.createCompany.id),
              seafreight_id: Number(rate.seafreight_id), // Ensure it's a string
              area: rate.area,
              cbm_rate: parseFloat(rate.cbm_rate.toString()),
              state: rate.state,
              minimum_charge: parseFloat(rate.minimum_charge.toString()),
            },
          });
        }

        toast({
          title: "Company and rates created successfully",
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        router.push("/admin/companies");
      } catch (error) {
        showGraphQLErrorToast(error as any);
      }
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  const handleRateChange = (index: number, field: string, value: any) => {
    const updatedRates = [...companyRates];
    updatedRates[index] = {
      ...updatedRates[index],
      [field]: value,
    };
    setCompanyRates(updatedRates);
  };

  const {
    // data: seafreightData,
    // loading: seafreightLoading,
    // error: seafreightError,
  } = useQuery(GET_LIST_OF_SEAFREIGHTS, {
    onCompleted(data) {
      const grouped = data.allSeafreights.reduce(
        (acc: { [x: string]: Seafreight[] }, item: any) => {
          if (!acc[item.state]) {
            acc[item.state] = [];
          }
          acc[item.state].push({
            value: item.id,
            label: item.location_name,
            cbm_rate: item.cbm_rate,
            min_charge: item.min_charge,
            state: item.state,
          });
          return acc;
        },
        {},
      );
      setGroupedSeafreights(grouped);
      const states = Object.keys(grouped).map((state) => ({
        value: state,
        label: state,
      }));
      setStateOptions(states);
    },
    onError(error) {
      console.error("GraphQL Error:", error);
      toast({
        title: "Error fetching seafreights",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    },
  });

  const handleSaveRow = (index: number) => {
    // debugger
    const currentRate = companyRates[index];

    // Validate all required fields
    if (!currentRate.state || !currentRate.area || !currentRate.seafreight_id || !currentRate.cbm_rate || !currentRate.minimum_charge) {
      toast({
        title: "Validation Error",
        description: "Please select State and Location, minimum charge and CBM rate before saving",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Only add a new row if all validations pass
    setCompanyRates((prevCompanyRates) => [
      ...prevCompanyRates,
      {
        id: "",
        company_id: "", // Replace with actual company ID if needed
        seafreight_id: null,
        area: "",
        state: "",
        cbm_rate: 0, // Changed to string to align with other fields
        minimum_charge: 0, // Changed to string to align with other fields
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    // Reset state selection for the new row
    setSelectedState("");
    setRegionOption([]);
    console.log(selectedState, regionOption)
  };

  const handleRegionChange = (selected: any) => {
    const selectedSeafreight = (groupedSeafreights as Record<string, any[]>)[
      selectedState
    ]?.find((item: any) => item.value === selected.value);

    if (selectedSeafreight) {
      // Check if the combination already exists
      if (isRegionAlreadyUsed(selectedState, selectedSeafreight.label)) {
        toast({
          title: "Duplicate Entry",
          description: `A rate for ${selectedSeafreight.label} in ${selectedState} already exists`,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Update only the current row with the selected values
      const currentIndex = companyRates.length - 1;
      const updatedRates = [...companyRates];
      updatedRates[currentIndex] = {
        ...updatedRates[currentIndex],
        seafreight_id: selected.value,
        area: selectedSeafreight.label,
        state: selectedState,
        cbm_rate: selectedSeafreight.cbm_rate || 0,
        minimum_charge: selectedSeafreight.min_charge || 0,
      };

      setCompanyRates(updatedRates);
    }
  };
  const handleStateChange = (selected: any) => {
    setSelectedState(selected.value);
  };

  const isRegionAlreadyUsed = (state: string, region: string) => {
    return companyRates.some(
      (rate) => rate.state === state && rate.area === region,
    );
  };
  

  return (
    <AdminLayout>
      <Box
        className="mk-companyCreate"
        pt={{ base: "130px", md: "97px", xl: "97px" }}
      >
        {/* Main Fields */}
        <Grid pt="32px" px="24px">
          <FormControl>
            <Flex justifyContent="space-between" alignItems="center">
              <h1 className="mb-0">New Company</h1>
              <Button
                fontSize="sm"
                variant="brand"
                onClick={() => handleCreateCompany()}
              >
                Create
              </Button>
            </Flex>

            <Divider className="my-6" />

            <h3 className="mb-4">Details</h3>

            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                Company Name
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="name"
                value={company.name}
                onChange={(e) =>
                  setCompany({ ...company, [e.target.name]: e.target.value })
                }
                placeholder=""
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontWeight="500"
                size="lg"
              />
            </Flex>

            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                ABN
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="abn"
                value={company.abn}
                onChange={(e) =>
                  setCompany({ ...company, [e.target.name]: e.target.value })
                }
                placeholder=""
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontWeight="500"
                size="lg"
              />
            </Flex>

            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                Main contact number
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="contact_phone"
                value={company.contact_phone}
                onChange={(e) =>
                  setCompany({ ...company, [e.target.name]: e.target.value })
                }
                placeholder="+61"
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontWeight="500"
                size="lg"
              />
            </Flex>

            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                Main contact email
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="contact_email"
                value={company.contact_email}
                onChange={(e) =>
                  setCompany({ ...company, [e.target.name]: e.target.value })
                }
                placeholder=""
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontWeight="500"
                size="lg"
              />
            </Flex>

            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                mb="0"
                width="200px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
              >
                Payment Terms
              </FormLabel>

              <Box className="!max-w-md w-full">
                <Select
                  placeholder="Select Payment Terms"
                  value={paymentTerms.find(
                    (term) => term.value === company.payment_term,
                  )}
                  options={paymentTerms}
                  onChange={(selectedOption) => {
                    setCompany({
                      ...company,
                      payment_term: selectedOption?.value,
                    });
                    // console.log("Selected:", selectedOption);
                  }}
                  size="lg"
                  className="select mb-0"
                  classNamePrefix="two-easy-select"
                />
              </Box>
            </Flex>

            <Divider />
            <h3 className="mt-6 mb-4">Billing</h3>
            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                Accounts email
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="account_email"
                value={company.account_email}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    [e.target.name]: e.target.value,
                  })
                }
                placeholder=""
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontWeight="500"
                size="lg"
              />
            </Flex>
            <h4 className="mt-6 mb-4">Billing Address</h4>
            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                Address
              </FormLabel>
              <Input
                type="text"
                name="address"
                value={company.address}
                placeholder=""
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontWeight="500"
                size="lg"
                onClick={() => setIsAddressModalOpen(true)}
              />
            </Flex>

            <AddressesModal
              defaultAddress={company}
              isModalOpen={isAddressModalOpen}
              description="Billing address"
              onModalClose={(e) => setIsAddressModalOpen(e)}
              onSetAddress={(target) => {
                setCompany({ ...company, ...target });
              }}
            />
            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                Address line 1
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="address_line_1"
                value={company.address_line_1}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    [e.target.name]: e.target.value,
                  })
                }
                placeholder=""
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontWeight="500"
                size="lg"
              />
            </Flex>
            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                Apt / Suite / Floor
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="address_line_2"
                value={company.address_line_2}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    [e.target.name]: e.target.value,
                  })
                }
                placeholder=""
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontWeight="500"
                size="lg"
              />
            </Flex>
            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                Address city
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="address_city"
                value={company.address_city}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    [e.target.name]: e.target.value,
                  })
                }
                placeholder=""
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontWeight="500"
                size="lg"
              />
            </Flex>
            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                Address state
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="address_state"
                value={company.address_state}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    [e.target.name]: e.target.value,
                  })
                }
                placeholder=""
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontWeight="500"
                size="lg"
              />
            </Flex>
            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                Address postcode
              </FormLabel>
              <Input
                isRequired={true}
                type="text"
                name="address_postal_code"
                value={company.address_postal_code}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    [e.target.name]: e.target.value,
                  })
                }
                placeholder=""
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontWeight="500"
                size="lg"
              />
            </Flex>
            <Divider />

            <Flex justifyContent="space-between" alignItems="center" mb={4}>
              <h3 className="mt-6 mb-4">Custom rate </h3>
            </Flex>
            <SimpleGrid columns={5} spacing={4} className="mb-4">
              <Box>                <FormLabel>STATE</FormLabel>              </Box>
              <Box>                <FormLabel>QUADRANT</FormLabel>              </Box>
              <Box>                <FormLabel>CBM RATE</FormLabel>              </Box>
              <Box>                <FormLabel>MIN CHARGE</FormLabel>              </Box>
            </SimpleGrid>
            {companyRates.slice(0, -1).map((rate, idx) => (
              <SimpleGrid key={idx} columns={5} spacing={4} className="mb-4">
                <Box>
                  <Input value={rate.state} isReadOnly />
                </Box>
                <Box>
                  <Input value={rate.area} isReadOnly />
                </Box>
                <Box>
                  <Input value={rate.cbm_rate} isReadOnly />
                </Box>
                <Box>
                  <Input value={rate.minimum_charge} isReadOnly />
                </Box>
              </SimpleGrid>
            ))}

            {/* Input row for new rate */}
            <SimpleGrid columns={5} spacing={4} className="mb-4">
              <Box>
                {/* <FormLabel>STATE</FormLabel> */}
                <Select
                  placeholder="Select State"
                  options={stateOptions}
                  onChange={handleStateChange}
                  value={stateOptions.find(
                    (option) => option.value === selectedState,
                  )}
                />
              </Box>
              <Box>
                {/* <FormLabel>QUADRANT</FormLabel> */}
                <Select
                  placeholder="Select Quadrant"
                  options={
                    selectedState ? groupedSeafreights[selectedState] : []
                  }
                  onChange={handleRegionChange}
                  isDisabled={!selectedState}
                />
              </Box>
              <Box>
                {/* <FormLabel>CBM RATE</FormLabel> */}
                <Input
                  type="number"
                  value={companyRates[companyRates.length - 1]?.cbm_rate || 0}
                  onChange={(e) =>
                    handleRateChange(
                      companyRates.length - 1,
                      "cbm_rate",
                      parseFloat(e.target.value),
                    )
                  }
                />
              </Box>
              <Box>
                {/* <FormLabel>MIN CHARGE</FormLabel> */}
                <Input
                  type="number"
                  value={
                    companyRates[companyRates.length - 1]?.minimum_charge || 0
                  }
                  onChange={(e) =>
                    handleRateChange(
                      companyRates.length - 1,
                      "minimum_charge",
                      parseFloat(e.target.value),
                    )
                  }
                />
              </Box>
              <Box>
                <Button
                  onClick={() => handleSaveRow(companyRates.length - 1)}
                  colorScheme="blue"
                  width="full"
                >
                  +
                </Button>
              </Box>
            </SimpleGrid>

            <Divider />
            <h3 className="mt-6 mb-4">Rates </h3>
            <Flex alignItems="center" mb="16px">
              <FormLabel
                display="flex"
                width="200px"
                fontSize="sm"
                mb="0"
                fontWeight="500"
                color={textColor}
              >
                LCL Rate
              </FormLabel>
              <Input
                isRequired={true}
                type="number"
                name="lcl_rate"
                value={company.lcl_rate}
                onChange={(e) =>
                  setCompany({
                    ...company,
                    [e.target.name]: parseFloat(e.target.value),
                  })
                }
                placeholder=""
                className="max-w-md"
                variant="main"
                fontSize="sm"
                ms={{ base: "0px", md: "0px" }}
                mb="0"
                fontWeight="500"
                size="lg"
              />
            </Flex>
          </FormControl>
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default CompanyCreate;
