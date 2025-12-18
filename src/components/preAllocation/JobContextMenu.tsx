import { ApolloError, useMutation, useQuery } from "@apollo/client";
import { CloseIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    Checkbox,
    Divider,
    Flex,
    FormControl,
    FormLabel,
    HStack,
    IconButton,
    Link,
    SimpleGrid,
    Text,
    useToast,
    VStack
} from "@chakra-ui/react";
import { Select } from "chakra-react-select";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import { UPDATE_JOB_RIGHT_MUTATION } from "graphql/job";
import {
    ASSIGN_META_TO_JOB_MUTATION,
    GET_JOB_META_LIST_QUERY,
    JobMeta,
} from "graphql/jobMeta";
import { GET_JOB_STATUSES_QUERY } from "graphql/jobStatus";
import React, { useEffect, useRef, useState } from "react";

/* ---------------- TYPES ---------------- */

type DriverOption = {
    value: string | number;
    label: string;
};

type StatusOption = {
    value: string;
    label: string;
};

interface JobContextMenuProps {
    job: any;
    position: { x: number; y: number };
    onClose: () => void;
    // onSave: (jobId: string, data: any) => void;
    drivers: DriverOption[];
}

/* ---------------- COMPONENT ---------------- */

const JobContextMenu: React.FC<JobContextMenuProps> = ({
    job,
    position,
    onClose,
    // onSave,
    drivers,
}) => {
    const toast = useToast();
    const menuRef = useRef<HTMLDivElement>(null);

    /* ---------------- STATE ---------------- */

    const [selectedDriver, setSelectedDriver] =
        useState<DriverOption | null>(null);

    const [selectedStatus, setSelectedStatus] =
        useState<StatusOption | null>(null);

    const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

    const [jobStatuses, setJobStatuses] = useState<StatusOption[]>([]);

    /* ---------------- QUERIES ---------------- */

    const { data: metaData } = useQuery(GET_JOB_META_LIST_QUERY);

    const { data: statusData } = useQuery(GET_JOB_STATUSES_QUERY, {
        variables: {
            query: "",
            page: 1,
            first: 100,
            orderByColumn: "id",
            orderByOrder: "ASC",
        },
    });

    const [assignMetaToJob] = useMutation(ASSIGN_META_TO_JOB_MUTATION);
    const [updateJobRight] = useMutation(UPDATE_JOB_RIGHT_MUTATION, {
        onError: (error) => {
            showGraphQLErrorToast(error);
        },
    });



    /* ---------------- 2️⃣ DRIVER + STATUS (BULK / SINGLE) ---------------- */

    const handleSave = async () => {
        try {
            /* ---------------- 1️⃣ ASSIGN LABELS ---------------- */
            if (selectedLabels.length > 0) {
                await Promise.all(
                    selectedLabels.map((labelId) =>
                        assignMetaToJob({
                            variables: {
                                input: {
                                    job_id: job.id,
                                    job_meta_id: labelId,
                                },
                            },
                        })
                    )
                );
            }
            /* ---------------- 2️⃣ UPDATE JOB (SINGLE) ---------------- */
            await updateJobRight({
                variables: {
                    input: {
                        id: job.id,
                        driver_id: selectedDriver?.value || null,
                        job_status_id: selectedStatus?.value || null,
                        customer_id: job.customer.id,
                        company_id: job.company.id,
                        job_type_id: job.job_type.id,
                    },
                },
            });

            /* ---------------- 3️⃣ SUCCESS ---------------- */
            toast({
                title: "Job updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            // refreshPage();
            onClose(); // ✅ only after everything success
        } catch (e: unknown) {
            console.error("Save failed", e);

            // Check if it's ApolloError
            if (e && typeof e === "object" && "graphQLErrors" in e) {
                showGraphQLErrorToast(e as ApolloError);
            } else {
                // fallback: wrap in a generic ApolloError-like object
                showGraphQLErrorToast({
                    graphQLErrors: [],
                    networkError: null,
                    message: "An unknown error occurred",
                    extraInfo: null,
                    name: "UnknownApolloError",
                    clientErrors: [],
                } as ApolloError);
            }
        }
    };


    /* ---------------- 3️⃣ SUCCESS ---------------- */

    /* ---------------- HELPERS ---------------- */

    const availableLabels: JobMeta[] =
        metaData?.jobMetaList?.filter(
            (m: JobMeta) => m.type?.toLowerCase() === "label"
        ) || [];

    const toggleLabel = (labelId: string) => {
        setSelectedLabels((prev) =>
            prev.includes(labelId)
                ? prev.filter((id) => id !== labelId)
                : [...prev, labelId]
        );
    };

    useEffect(() => {
        if (job?.driver_id) {
            setSelectedDriver(
                drivers.find((d) => String(d.value) === String(job.driver_id)) || null
            );
        }

        if (job?.job_status) {
            setSelectedStatus({
                value: String(job.job_status.id),
                label: job.job_status.name,
            });
        }

        console.log("job meta:", job);

        if (job?.meta) {
            setSelectedLabels(job.meta.map((l: any) => String(l.id)));
        }
    }, [job, drivers]);
    useEffect(() => {
        if (statusData?.jobStatuses?.data) {
            setJobStatuses(
                statusData.jobStatuses.data.map((s: any) => ({
                    value: String(s.id),
                    label: s.name,
                }))
            );
        }
    }, [statusData]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("click", handleClickOutside); // <- changed here
        return () => document.removeEventListener("click", handleClickOutside);
    }, [onClose]);


    /* ---------------- POSITION ---------------- */

    const adjustedPosition = {
        left: Math.min(position.x, window.innerWidth - 380),
        top: Math.min(position.y, window.innerHeight - 550),
    };

    /* ---------------- UI ---------------- */

    return (
        <Box
            ref={menuRef}
            position="fixed"
            left={`${adjustedPosition.left}px`}
            top={`${adjustedPosition.top}px`}
            bg="white"
            boxShadow="xl"
            borderRadius="md"
            border="1px solid"
            borderColor="gray.200"
            width="360px"
            zIndex={9999}
            p={4}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            {/* HEADER */}
            <Flex justify="space-between" align="center" mb={3}>
                <Text fontWeight="semibold">
                    Job #{job.name}
                    <Link
                        href={`/admin/jobs/${job.id}`}
                        isExternal
                        ml={1}
                        color="blue.500"
                    >
                        <ExternalLinkIcon />
                    </Link>
                </Text>
                <IconButton
                    aria-label="Close"
                    icon={<CloseIcon />}
                    size="xs"
                    onClick={onClose}
                />
            </Flex>

            <Divider mb={3} />

            <VStack spacing={4} align="stretch">
                {/* LABELS */}
                <FormControl>
                    <FormLabel fontSize="sm">Labels</FormLabel>
                    <SimpleGrid columns={2} spacing={2}>
                        {availableLabels.map((label) => (
                            <Checkbox
                                key={label.id}
                                size="sm"
                                isChecked={selectedLabels.includes(String(label.id))}
                                onChange={() => toggleLabel(String(label.id))}
                            >
                                <HStack spacing={2}>
                                    <Box
                                        w="10px"
                                        h="10px"
                                        borderRadius="full"
                                        bg={label.color || "gray.300"}
                                    />
                                    <Text fontSize="sm">{label.name}</Text>
                                </HStack>
                            </Checkbox>
                        ))}
                    </SimpleGrid>
                </FormControl>

                <Divider />

                {/* DRIVER */}
                <FormControl>
                    <FormLabel fontSize="sm">Assign Driver</FormLabel>
                    <Select
                        options={drivers}
                        value={selectedDriver}
                        onChange={(opt) => setSelectedDriver(opt)}
                        placeholder="Select Driver"
                        isClearable
                    />
                </FormControl>

                {/* STATUS */}
                <FormControl>
                    <FormLabel fontSize="sm">Status</FormLabel>
                    <Select
                        options={jobStatuses}
                        value={selectedStatus}
                        onChange={(opt) => setSelectedStatus(opt)}
                        placeholder="Select Status"
                        isClearable
                    />
                </FormControl>

                <Divider />

                {/* ACTIONS */}
                <HStack>
                    <Button size="sm" variant="outline" flex={1} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button size="sm" colorScheme="blue" flex={1} onClick={handleSave}>
                        Save
                    </Button>
                </HStack>
            </VStack>
        </Box>
    );
};

export default JobContextMenu;
