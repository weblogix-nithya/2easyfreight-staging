
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
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { faUserMinus } from "@fortawesome/pro-regular-svg-icons";
import { faFileInvoiceDollar,faGear, faUserLock } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select } from "chakra-react-select";
import AddressesModal from "components/addresses/AddressesModal";
// import InvoiceTab from "components/companies/InvoiceTab";
import FileInputLink from "components/fileInput/FileInputLink";
import { SearchBar } from "components/navbar/searchBar/SearchBar";
import PaginationTable from "components/table/PaginationTable";
import { showGraphQLErrorToast } from "components/toast/ToastError";
// GraphQL imports
import {
  defaultVendor,
  DELETE_VENDOR_MUTATION,
  GET_VENDOR_QUERY,
  paymentTerms,
  UPDATE_VENDOR_MUTATION,
} from "graphql/vendor";
// import {
//   GET_CUSTOMERS_QUERY,
//   UPDATE_CUSTOMER_MUTATION,
// } from "graphql/customer";
import AdminLayout from "layouts/admin";
import debounce from "lodash.debounce";
// Next.js and React imports
import { useRouter } from "next/router";
import { useMemo, useState } from "react";


function VendorEdit() {
  const toast = useToast();
  let menuBg = useColorModeValue("white", "navy.800");
  const textColor = useColorModeValue("navy.700", "white");
  const textColorSecondary = "gray.400";
  const [vendor, setVendor] = useState(defaultVendor);
  const [isVendorSetting, setIsVendorSetting] = useState(0);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();
  const { id } = router.query;
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const {
    loading: vendorLoading,
    data: vendorData,
    refetch: getVendor,
  } = useQuery(GET_VENDOR_QUERY, {
    variables: {
      id: id,
    },
    skip: typeof id === 'undefined' || id === null, 
    onCompleted: (data) => {
      if (data?.vendor == null) {
        // router.push("/admin/vendors");
      }
      setVendor({ ...vendor, ...data?.vendor });
    },
    onError(error) {
      console.log("onError");
      console.log(error);
    },
  });

  const [handleUpdateVendor, { }] = useMutation(UPDATE_VENDOR_MUTATION, {
    variables: {
      input: { ...vendor, rate_card_url: undefined, logo_url: undefined },
    },
    onCompleted: (data) => {
      toast({
        title: "Vendor updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  const [handleDeleteVendor, { }] = useMutation(DELETE_VENDOR_MUTATION, {
    variables: {
      id: id,
    },
    onCompleted: (data) => {
      toast({
        title: "Vendor deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      router.push("/admin/vendors");
    },
    onError: (error) => {
      showGraphQLErrorToast(error);
    },
  });

  const [queryPageIndex, setQueryPageIndex] = useState(0);
  const [queryPageSize, setQueryPageSize] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");

  const onChangeSearchQuery = useMemo(() => {
    return debounce((e) => {
      setSearchQuery(e);
      setQueryPageIndex(0);
    }, 300);
  }, []);

  const [availableCustomersOptions, setAvailableCustomersOptions] = useState(
    [],
  );
  const [searchAvailableCustomerQuery, setSearchAvailableCustomerQuery] =
    useState("");

  const [selectCustomerId, setSelectCustomerId] = useState(null);

  const onChangeSearchAvailableCustomerQuery = useMemo(() => {
    return debounce((e) => {
      setSearchAvailableCustomerQuery(e);
    }, 300);
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: "First Name",
        accessor: "first_name" as const,
      },
      {
        Header: "Last Name",
        accessor: "last_name" as const,
      },
      {
        Header: "Phone Number",
        accessor: "phone_no" as const,
      },
      {
        Header: "Vendor Role",
        accessor: "is_vendor_admin" as const,
        trueLabel: "Admin",
        falseLabel: "User",
        type: "boolean",
      },
      {
        Header: "Send POD",
        accessor: "is_pod_sendable" as const,
        trueLabel: "Yes",
        falseLabel: "No",
        type: "boolean",
      },
      {
        Header: "Send Invoice",
        accessor: "is_invoice_sendable" as const,
        trueLabel: "Yes",
        falseLabel: "No",
        type: "boolean",
      },
      {
        Header: "Email",
        accessor: "email" as const,
      },
      {
        Header: "Actions",
        accessor: "id" as const,
        isDelete: true,
        isView: true,
        isEdit: false,
        deleteIcon: faUserMinus,
      },
    ],
    [],
  );

  // const {
  //   loading: availableCustomersLoading,
  //   data: availableCustomers,
  //   refetch: getAvailableCustomers,
  // } = useQuery(GET_CUSTOMERS_QUERY, {
  //   variables: {
  //     query: searchQuery,
  //     page: queryPageIndex + 1,
  //     first: queryPageSize,
  //     orderByColumn: "id",
  //     orderByOrder: "ASC",
  //     vendor_id: null,
  //   },
  //   onCompleted: (data) => {
  //     setAvailableCustomersOptions([]);
  //     data.customers.data.map((customer: any) => {
  //       setAvailableCustomersOptions((availableCustomersOptions) => [
  //         ...availableCustomersOptions,
  //         { value: parseInt(customer.id), label: customer.email },
  //       ]);
  //     });
  //   },
  // });

  // const {
  //   loading,
  //   error,
  //   data: customers,
  //   refetch: getCustomers,
  // } = useQuery(GET_CUSTOMERS_QUERY, {
  //   variables: {
  //     query: searchQuery,
  //     page: queryPageIndex + 1,
  //     first: queryPageSize,
  //     orderByColumn: "id",
  //     orderByOrder: "ASC",
  //     vendor_id: id,
  //   },
  // });

  // const [addCustomerToVendor, { }] = useMutation(UPDATE_CUSTOMER_MUTATION, {
  //   variables: {
  //     input: {
  //       id: selectCustomerId,
  //       vendor_id: id,
  //     },
  //   },
  //   onCompleted: (data) => {
  //     toast({
  //       title: "Customer updated",
  //       status: "success",
  //       duration: 3000,
  //       isClosable: true,
  //     });
  //     onClose();
  //     getCustomers();
  //     getAvailableCustomers();
  //   },
  //   onError: (error) => {
  //     showGraphQLErrorToast(error);
  //   },
  // });

  // const [removeCustomerFromVendor, { }] = useMutation(
  //   UPDATE_CUSTOMER_MUTATION,
  //   {
  //     variables: {
  //       input: {
  //         id: selectCustomerId,
  //         vendor_id: null,
  //       },
  //     },
  //     onCompleted: (data) => {
  //       toast({
  //         title: "Customer removed",
  //         status: "success",
  //         duration: 3000,
  //         isClosable: true,
  //       });
  //       getCustomers();
  //       getAvailableCustomers();
  //     },
  //     onError: (error) => {
  //       showGraphQLErrorToast(error);
  //     },
  //   },
  // );

  return (
    <AdminLayout>
      <Box
        className="mk-vendors-id"
        pt={{ base: "130px", md: "97px", xl: "97px" }}
      >
        {/* Main Fields */}
        <Grid pr="24px">
          {!vendorLoading && (
            <>
              <Grid
                templateAreas={`"nav main"`}
                gridTemplateRows={"90vh"}
                gridTemplateColumns={"25% 1fr"}
                h="auto"
                gap="1"
                color="blackAlpha.700"
                fontWeight="bold"
              >
                {/* Left side */}
                <GridItem
                  area={"nav"}
                  className="border-r border-[var(--chakra-colors-gray-200)]"
                >
                  <Box mx="26px">
                    <h2 className="mt-10 mb-4">{vendor?.name}</h2>
                  </Box>

                  {/* Left side buttons */}
                  <Flex mt={8} flexDirection="column" className="border-b">
                    <Button
                      disabled={isVendorSetting == 0}
                      onClick={() => setIsVendorSetting(0)}
                      alignItems="start"
                      h={45}
                      fontSize="14px"
                      className={
                        isVendorSetting == 0
                          ? "!items-center !justify-start !font-medium text-white !bg-[var(--chakra-colors-primary-400)] !rounded-none"
                          : "!items-center !justify-start !font-medium text-[var(--chakra-colors-black-400)] !bg-white !rounded-none"
                      }
                    >
                      <FontAwesomeIcon icon={faGear} className="mr-1" />
                      Vendor Settings
                    </Button>

                    {/* <Button
                      disabled={isVendorSetting == 1}
                      onClick={() => setIsVendorSetting(1)}
                      alignItems="start"
                      h={45}
                      fontSize="14px"
                      className={
                        isVendorSetting == 1
                          ? "!items-center !justify-start !font-medium !text-left text-white !bg-[var(--chakra-colors-primary-400)] !rounded-none"
                          : "!items-center !justify-start !font-medium text-[var(--chakra-colors-black-400)] !bg-white !rounded-none"
                      }
                    >
                      <FontAwesomeIcon icon={faUserLock} className="mr-1" />
                      Vendor Users
                    </Button>

                    <Button
                      disabled={isVendorSetting == 2}
                      onClick={() => setIsVendorSetting(2)}
                      alignItems="start"
                      h={45}
                      fontSize="14px"
                      className={
                        isVendorSetting == 2
                          ? "!items-center !justify-start !font-medium !text-left text-white !bg-[var(--chakra-colors-primary-400)] !rounded-none"
                          : "!items-center !justify-start !font-medium text-[var(--chakra-colors-black-400)] !bg-white !rounded-none"
                      }
                    >
                      <FontAwesomeIcon icon={faFileInvoiceDollar} className="mr-1" />
                      Invoices
                    </Button> */}
                  </Flex>
                </GridItem>

                {/* Right side */}
                <GridItem pl="2" area={"main"}>
                  {/* Vendor Settings */}
                  {isVendorSetting == 0 && (
                    <FormControl className="pb-10">
                      <Flex
                        justifyContent="space-between"
                        alignItems="center"
                        mb="24px"
                        className="mt-8"
                      >
                        <h2 className="mb-0">Vendor Settings</h2>
                        <Flex>
                          <Button
                            fontSize="sm"
                            lineHeight="19px"
                            variant="brand"
                            fontWeight="500"
                            w="100%"
                            h="50"
                            mb="0"
                            ms="10px"
                            className="!h-[39px]"
                            onClick={() => handleUpdateVendor()}
                            isLoading={vendorLoading}
                          >
                            Update
                          </Button>
                        </Flex>
                      </Flex>
                      <Divider />
                      <h3 className="mt-6 mb-4">Details</h3>
                      <Flex alignItems="center" mb="16px">
                        <FormLabel
                          display="flex"
                          mb="0"
                          width="200px"
                          fontSize="sm"
                          fontWeight="500"
                          color={textColor}
                        >
                          Name
                        </FormLabel>
                        <Input
                          isRequired={true}
                          variant="main"
                          value={vendor?.name}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
                              [e.target.name]: e.target.value,
                            })
                          }
                          type="text"
                          name="name"
                          className="max-w-md"
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
                          value={vendor?.abn}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
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
                          Main contact number
                        </FormLabel>
                        <Input
                          isRequired={true}
                          type="text"
                          name="contact_phone"
                          value={vendor?.contact_phone}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
                              [e.target.name]: e.target.value,
                            })
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
                          value={vendor?.contact_email}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
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
                            value={paymentTerms?.find((term) => term.value === vendor?.payment_term)}
                            options={paymentTerms}
                            onChange={(selectedOption) => {
                              setVendor({ ...vendor, payment_term: selectedOption?.value });
                              console.log("Selected:", selectedOption);
                            }}
                            size="lg"
                            className="select mb-0"
                            classNamePrefix="two-easy-select"
                          />
                        </Box>
                      </Flex>

                      <Flex alignItems="start" mb="16px">
                        <FormLabel
                          display="flex"
                          width="200px"
                          fontSize="sm"
                          mb="0"
                          fontWeight="500"
                          color={textColor}
                        >
                          Admin Notes
                        </FormLabel>

                        <Textarea
                          name="admin_notes"
                          value={vendor?.admin_notes}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
                              [e.target.name]: e.target.value,
                            })
                          }
                          className="mb-4 max-w-md"
                          fontSize="sm"
                          rows={4}
                          placeholder="Admin Notes"
                        />
                      </Flex>

                      <Flex alignItems="start" mb="16px">
                        <FormLabel
                          display="flex"
                          width="200px"
                          fontSize="sm"
                          mb="0"
                          fontWeight="500"
                          color={textColor}
                        >
                          Base Notes
                        </FormLabel>

                        <Flex className="flex-col w-full max-w-md">
                          <Textarea
                            name="base_notes"
                            value={vendor?.base_notes}
                            onChange={(e) =>
                              setVendor({
                                ...vendor,
                                [e.target.name]: e.target.value,
                              })
                            }
                            fontSize="sm"
                            className="w-full max-w-md"
                            rows={4}
                            placeholder="Base Notes"
                          />
                          <p className=" bottom-[0] mt-2 text-[10px] text-[var(--chakra-colors-black-500)] font-medium">
                            Base notes are displayed to drivers on all jobs
                            placed by this customer
                          </p>
                        </Flex>
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
                          value={vendor?.account_email}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
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
                          value={vendor?.address}
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
                        defaultAddress={vendor}
                        isModalOpen={isAddressModalOpen}
                        description="Billing address"
                        onModalClose={(e) => setIsAddressModalOpen(e)}
                        onSetAddress={(target) => {
                          setVendor({ ...vendor, ...target });
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
                          value={vendor?.address_line_1}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
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
                          value={vendor?.address_line_2}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
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
                          value={vendor?.address_city}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
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
                          value={vendor?.address_state}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
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
                          value={vendor?.address_postal_code}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
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

                      <h3 className="mt-6 mb-4">Rates</h3>

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
                          value={vendor?.lcl_rate}
                          onChange={(e) =>
                            setVendor({
                              ...vendor,
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
                      <Divider />

                      <h3 className="mt-6 mb-4">Notifications</h3>
                      <Flex className="w-full" alignItems="center">
                        <FormLabel
                          display="flex"
                          mb="0"
                          width="200px"
                          fontSize="sm"
                          fontWeight="500"
                          color={textColor}
                        >
                          Send POD
                        </FormLabel>

                        <RadioGroup
                          value={vendor?.is_pod_sendable ? "1" : "0"}
                          onChange={(e) => {
                            setVendor({
                              ...vendor,
                              is_pod_sendable: e === "1" ? true : false,
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
                      </Flex>
                      <Flex className="w-full" alignItems="center">
                        <FormLabel
                          display="flex"
                          mb="0"
                          width="200px"
                          fontSize="sm"
                          fontWeight="500"
                          color={textColor}
                        >
                          Send Invoice
                        </FormLabel>

                        <RadioGroup
                          value={vendor?.is_invoice_sendable ? "1" : "0"}
                          onChange={(e) => {
                            setVendor({
                              ...vendor,
                              is_invoice_sendable: e === "1" ? true : false,
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
                      </Flex>
                    </FormControl>
                  )}

                  {/* Vendor Users */}
                  {isVendorSetting == 1 && (
                    <>
                      <Flex
                        justifyContent="space-between"
                        alignItems="center"
                        mb="24px"
                        className="mt-8"
                      >
                        <h2 className="mb-0">Vendor Users</h2>
                        <Flex>
                          <Link
                            href={`/admin/customers/create?vendor_id=${id}`}
                            me="8px"
                          >
                            <Button
                              fontSize="sm"
                              variant="brand"
                              fontWeight="500"
                              lineHeight="19px"
                              w="100%"
                              h="50"
                              mb="0"
                              ms="10px"
                              className="!h-[39px]"
                            >
                              Create New
                            </Button>
                          </Link>

                          {/* <Button
                            fontSize="sm"
                            variant="brand"
                            fontWeight="500"
                            lineHeight="19px"
                            w="100%"
                            h="50"
                            mb="0"
                            ms="10px"
                            onClick={onOpen}
                            className="!h-[39px]"
                          >
                            Add existing
                          </Button>

                          <Modal isOpen={isOpen} onClose={onClose}>
                            <ModalOverlay />

                            <ModalContent>
                              <ModalHeader>Add existing customer</ModalHeader>
                              <ModalCloseButton />

                              <ModalBody>
                                <Divider mb="24px" />
                                <Text mb="24px">
                                  Search existing customers to add to this
                                  vendor
                                </Text>
                                <Box className="!max-w-md w-full">
                                  <Select
                                    placeholder="Select customer"
                                    options={availableCustomersOptions}
                                    onChange={(e) => {
                                      setSelectCustomerId(e.value);
                                    }}
                                    size="lg"
                                    className="select mb-0"
                                    classNamePrefix="two-easy-select"
                                  ></Select>
                                </Box>
                              </ModalBody>

                              <ModalFooter>
                                <Button
                                  variant="outline"
                                  mr="auto"
                                  onClick={onClose}
                                >
                                  Close
                                </Button>
                                <Button
                                  variant="primary"
                                  onClick={() => addCustomerToVendor()}
                                >
                                  Add to vendor
                                </Button>
                              </ModalFooter>
                            </ModalContent>
                          </Modal> */}
                        </Flex>
                      </Flex>

                      <Divider />

                      <Box pt={{ base: "40px", md: "40px", xl: "40px" }}>
                        <SimpleGrid
                          mb="20px"
                          columns={{ sm: 1 }}
                          spacing={{ base: "20px", xl: "20px" }}
                        >
                          <Flex minWidth="max-content">
                            <SearchBar
                              background={menuBg}
                              onChangeSearchQuery={onChangeSearchQuery}
                              me="10px"
                              borderRadius="30px"
                            />
                          </Flex>

                          {/* {!loading &&
                            customers?.customers.data.length >= 0 && (
                              <PaginationTable
                                columns={columns}
                                showDelete={true}
                                data={customers?.customers.data}
                                options={{
                                  initialState: {
                                    pageIndex: queryPageIndex,
                                    pageSize: queryPageSize,
                                  },
                                  manualPagination: true,
                                  pageCount:
                                    customers?.customers.paginatorInfo.lastPage,
                                }}
                                setQueryPageIndex={setQueryPageIndex}
                                setQueryPageSize={setQueryPageSize}
                                onDelete={(id: any) => {
                                  setSelectCustomerId(id);
                                  removeCustomerFromVendor();
                                }}
                                isServerSide
                                path="/admin/customers"
                              />
                            )} */}
                        </SimpleGrid>
                      </Box>
                    </>
                  )}
                  {/* Invoice */}
                  {/* {isVendorSetting == 2 && (
                    <>
                      {vendor?.id !== null && <InvoiceTab vendor_id={vendor?.id} />}

                    </>
                  )} */}
                </GridItem>
              </Grid>
            </>
          )}
        </Grid>
      </Box>
    </AdminLayout>
  );
}

export default VendorEdit;
