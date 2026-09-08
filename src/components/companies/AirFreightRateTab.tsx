import { useMutation, useQuery } from "@apollo/client";
import {
    Box,
    Button,
    Divider,
    Flex,
    FormControl,
    Grid,
    IconButton,
    Input,
    SimpleGrid,
    Text,
    useToast,
} from "@chakra-ui/react";
import { faTimes } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select } from "chakra-react-select";
import { GET_LIST_OF_SEAFREIGHTS } from "graphql/CompanyRate";
import {
    AirFreightCompanyRate as CompanyRateAirFreight,
    CREATE_AIR_FREIGHT_COMPANY_RATE,
    DELETE_AIR_FREIGHT_COMPANY_RATE,
    GET_AIR_RATES_BY_COMPANY,
    UPDATE_AIR_FREIGHT_COMPANY_RATE,
} from "graphql/CompanyRateAirFreight";
import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface Props {
    company_id: string | number;
}

// ─── Helper: Apollo proxy → plain object ──────────────────────────────────────
// Apollo cache objects have non-enumerable props — spread/JSON.stringify fails.
// Property access (r.id, r.state) bypasses the proxy and returns actual values.
const toPlainRate = (r: any): CompanyRateAirFreight | null => {
    // Guard: second onCompleted call-ல் Apollo stale cache reference வரும்.
    // id இல்லன்னா skip — invalid object.
    if (!r?.id) return null;
    return {
        id: r.id,
        company_id: r.company_id,
        seafreight_id: r.seafreight_id ?? null,
        state: r.state ?? "",
        area: r.area ?? "",
        min_weight: r.min_weight ?? 0,
        max_weight: r.max_weight ?? 0,
        per_kg_rate: r.per_kg_rate ?? 0,
        per_km_rate: r.per_km_rate ?? 0,
        cbm_rate: r.cbm_rate ?? 0,
        minimum_charge: r.minimum_charge ?? 0,
        fuel_surcharge: r.fuel_surcharge ?? 0,
        is_active: r.is_active ?? true,
    };
};

// ─── Component ────────────────────────────────────────────────────────────────

function AirFreightRateTab({ company_id }: Props) {
    const toast = useToast();

    // ── Seafreight data ───────────────────────────────────────────────────────
    const [groupedSeafreights, setGroupedSeafreights] = useState<GroupedSeafreights>({});
    const [stateOptions, setStateOptions] = useState<{ value: string; label: string }[]>([]);
    const seafreightsReadyRef = useRef(false);

    // ── Air rates state ───────────────────────────────────────────────────────
    const [airRates, setAirRates] = useState<CompanyRateAirFreight[]>([]);
    const [prevAirRates, setPrevAirRates] = useState<CompanyRateAirFreight[]>([]);
    const [isAddingRate, setIsAddingRate] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedNewState, setSelectedNewState] = useState("");

    const emptyRate = (): Partial<CompanyRateAirFreight> => ({
        company_id: String(company_id),
        state: "",
        area: "",
        min_weight: 0,
        max_weight: 0,
        per_kg_rate: 0,
        per_km_rate: 0,
        cbm_rate: 0,
        minimum_charge: 0,
        fuel_surcharge: 0,
        is_active: true,
    });

    const [newRate, setNewRate] = useState<Partial<CompanyRateAirFreight>>(emptyRate());

    // ── Helper: parse + guard + set state ────────────────────────────────────
    const applyRates = (rawList: any[]) => {
        // toPlainRate returns null for invalid/stale Apollo refs → filter them out
        const valid = rawList.map(toPlainRate).filter(Boolean) as CompanyRateAirFreight[];
        // Only update state if we got valid records
        // (prevents second onCompleted stale-cache call from wiping good data)
        if (valid.length > 0) {
            console.log("applyRates — valid rates:", valid);
            setAirRates(valid);
            setPrevAirRates(valid);
        } else {
            console.warn("applyRates — all records invalid/stale, skipping state update");
        }
    };

    // ── Step 1: Load seafreights ──────────────────────────────────────────────
    const { loading: seafreightsLoading } = useQuery(GET_LIST_OF_SEAFREIGHTS, {
        onCompleted(data) {
            const grouped = data.allSeafreights.reduce((acc: GroupedSeafreights, item: any) => {
                if (!acc[item.state]) acc[item.state] = [];
                acc[item.state].push({
                    value: item.id,
                    label: item.location_name,
                    cbm_rate: item.cbm_rate,
                    min_charge: item.min_charge,
                    state: item.state,
                });
                return acc;
            }, {});
            setGroupedSeafreights(grouped);
            setStateOptions(Object.keys(grouped).map((s) => ({ value: s, label: s })));
            seafreightsReadyRef.current = true;
        },
        onError(error) {
            toast({ title: "Error fetching states", description: error.message, status: "error", duration: 5000, isClosable: true });
        },
    });

    // ── Step 2: Load air rates ────────────────────────────────────────────────
    const { refetch: refetchAirRates } = useQuery(GET_AIR_RATES_BY_COMPANY, {
        variables: { company_id },
        skip: !company_id,
        fetchPolicy: "network-only",
        onCompleted: (data) => {
            if (data?.getAirRatesByCompany) {
                applyRates(data.getAirRatesByCompany);
            }
        },
        onError: (error) => {
            toast({ title: "Error fetching air rates", description: error.message, status: "error", duration: 5000, isClosable: true });
        },
    });

    useEffect(() => {
        if (company_id) refetchAirRates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [company_id]);

    // ── Mutations ─────────────────────────────────────────────────────────────
    const [createAirRate] = useMutation(CREATE_AIR_FREIGHT_COMPANY_RATE);
    const [updateAirRate] = useMutation(UPDATE_AIR_FREIGHT_COMPANY_RATE);
    const [deleteAirRate] = useMutation(DELETE_AIR_FREIGHT_COMPANY_RATE);

    const parseNum = (v: any) => parseFloat(v) || 0;

    const refreshRates = async () => {
        const { data } = await refetchAirRates({ company_id });
        if (data?.getAirRatesByCompany) {
            applyRates(data.getAirRatesByCompany);
        }
    };

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleInputChange = (rateId: string, field: keyof CompanyRateAirFreight, value: any) => {
        const numericFields: (keyof CompanyRateAirFreight)[] = [
            "min_weight", "max_weight", "per_kg_rate", "per_km_rate",
            "cbm_rate", "minimum_charge", "fuel_surcharge",
        ];
        setAirRates((prev) =>
            prev.map((r) =>
                r.id === rateId
                    ? { ...r, [field]: numericFields.includes(field) ? parseNum(value) : value }
                    : r
            )
        );
        setIsEditMode(true);
    };

    const handleRowStateChange = (rateId: string, newState: string) => {
        setAirRates((prev) =>
            prev.map((r) =>
                r.id === rateId
                    ? { ...r, state: newState, area: "", seafreight_id: null }
                    : r
            )
        );
        setIsEditMode(true);
    };

    const handleRowAreaChange = (rateId: string, selected: any, currentState: string) => {
        const sf = groupedSeafreights[currentState]?.find((s) => s.value === selected.value);
        if (!sf) return;
        setAirRates((prev) =>
            prev.map((r) =>
                r.id === rateId
                    ? { ...r, area: sf.label, seafreight_id: String(sf.value) }
                    : r
            )
        );
        setIsEditMode(true);
    };

    const handleNewStateChange = (selected: any) => {
        setSelectedNewState(selected.value);
        setNewRate({ ...newRate, state: selected.value, area: "", seafreight_id: null });
    };

    const handleNewAreaChange = (selected: any) => {
        const sf = groupedSeafreights[selectedNewState]?.find((s) => s.value === selected.value);
        if (!sf) return;
        setNewRate({ ...newRate, area: sf.label, seafreight_id: String(sf.value) });
    };

    const isNewRateValid = () =>
        !!(newRate.state && newRate.area && (newRate.per_kg_rate > 0 || newRate.cbm_rate > 0) && newRate.minimum_charge > 0);

    const hasValidChangesToSave = () => {
        if (isAddingRate) return isNewRateValid();
        return airRates.some((rate) => {
            const prev = prevAirRates.find((p) => p.id === rate.id);
            return prev && JSON.stringify(prev) !== JSON.stringify(rate);
        });
    };

    const buildInput = (rate: Partial<CompanyRateAirFreight>) => ({
        company_id: String(company_id),
        seafreight_id: rate.seafreight_id ?? null,
        state: rate.state ?? "",
        area: rate.area ?? "",
        min_weight: parseNum(rate.min_weight),
        max_weight: parseNum(rate.max_weight),
        cbm_rate: parseNum(rate.cbm_rate),
        minimum_charge: parseNum(rate.minimum_charge),
        per_km_rate: parseNum(rate.per_km_rate),
        per_kg_rate: parseNum(rate.per_kg_rate),
        fuel_surcharge: parseNum(rate.fuel_surcharge),
        is_active: rate.is_active ?? true,
    });

    const saveRates = async () => {
        try {
            setIsSaving(true);
            if (isAddingRate) {
                if (!isNewRateValid()) {
                    toast({ title: "Validation Error", description: "State, Area, Min Charge, and at least one rate (Per KG or CBM) are required", status: "error", duration: 3000, isClosable: true });
                    return;
                }
                await createAirRate({ variables: { input: buildInput(newRate) } });
                toast({ title: "Air freight rate added successfully", status: "success", duration: 3000, isClosable: true });
            } else if (isEditMode) {
                const modified = airRates.filter((rate) => {
                    const prev = prevAirRates.find((p) => p.id === rate.id);
                    return prev && JSON.stringify(prev) !== JSON.stringify(rate);
                });
                for (const rate of modified) {
                    await updateAirRate({ variables: { id: rate.id, input: buildInput(rate) } });
                }
                toast({ title: "Air freight rates updated successfully", status: "success", duration: 3000, isClosable: true });
            }
            await refreshRates();
            setNewRate(emptyRate());
            setSelectedNewState("");
            setIsAddingRate(false);
            setIsEditMode(false);
        } catch (error) {
            toast({ title: "Error saving air freight rates", description: error instanceof Error ? error.message : "Unknown error", status: "error", duration: 3000, isClosable: true });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteAirRate({ variables: { id } });
            await refreshRates();
            toast({ title: "Air freight rate deleted", status: "success", duration: 3000, isClosable: true });
        } catch (error) {
            toast({ title: "Error deleting rate", description: error instanceof Error ? error.message : "Unknown error", status: "error", duration: 3000, isClosable: true });
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    if (seafreightsLoading) {
        return <Text fontSize="sm" color="gray.400" textAlign="center" py={6}>Loading...</Text>;
    }

    console.log("Rendering AirFreightRateTab with airRates:", airRates);

    return (
        <Box>
            <Flex justifyContent="flex-end" mb={4}>
                <Button
                    onClick={() => { setIsAddingRate(true); setNewRate(emptyRate()); setSelectedNewState(""); }}
                    fontSize="sm"
                    variant="brand"
                    fontWeight="500"
                    isDisabled={isAddingRate}
                >
                    + Add Rate
                </Button>
            </Flex>

            {/* Table Header */}
            <Grid templateColumns="1fr 1fr 1fr 1fr 1fr 1fr 40px" gap={3} mb={2} px={1}>
                {["STATE", "AREA / AIRPORT", "MIN KG", "MAX KG", "PER KG", "MIN CHARGE", ""].map((h, i) => (
                    <Text key={i} fontSize="xs" fontWeight="700" color="gray.500">{h}</Text>
                ))}
            </Grid>
            <Divider mb={4} />

            {airRates.length === 0 && !isAddingRate && (
                <Text fontSize="sm" color="gray.400" textAlign="center" py={6}>
                    No air freight rates found. Click &quot;+ Add Rate&quot; to create one.
                </Text>
            )}

            {/* Existing Rates */}
            {airRates.map((rate) => {
                const currentState = rate.state ?? "";
                const areaOptions = groupedSeafreights[currentState] || [];

                const selectedAreaOption =
                    areaOptions.find((o) => String(o.value) === String(rate.seafreight_id)) ||
                    areaOptions.find((o) => o.label === rate.area) ||
                    (rate.area ? { value: rate.area, label: rate.area } : null);

                return (
                    <SimpleGrid key={rate.id} columns={7} spacing={3} mb={3} alignItems="center">

                        <FormControl>
                            <Select
                                value={
                                    stateOptions.find((o) => o.value === currentState) ||
                                    (currentState ? { value: currentState, label: currentState } : null)
                                }
                                options={stateOptions}
                                onChange={(selected) => handleRowStateChange(rate.id, selected.value)}
                                placeholder="State"
                                size="sm"
                            />
                        </FormControl>

                        <FormControl>
                            <Select
                                value={selectedAreaOption}
                                options={areaOptions}
                                onChange={(selected) => handleRowAreaChange(rate.id, selected, currentState)}
                                placeholder="Area / Airport"
                                isDisabled={!currentState}
                                size="sm"
                            />
                        </FormControl>

                        <Input size="sm" type="number" value={rate.min_weight ?? ""} placeholder="0" onChange={(e) => handleInputChange(rate.id, "min_weight", e.target.value)} />
                        <Input size="sm" type="number" value={rate.max_weight ?? ""} placeholder="0" onChange={(e) => handleInputChange(rate.id, "max_weight", e.target.value)} />
                        <Input size="sm" type="number" value={rate.per_kg_rate ?? ""} placeholder="0.00" onChange={(e) => handleInputChange(rate.id, "per_kg_rate", e.target.value)} />
                        <Input size="sm" type="number" value={rate.minimum_charge ?? ""} placeholder="0.00" onChange={(e) => handleInputChange(rate.id, "minimum_charge", e.target.value)} />
                        <IconButton
                            aria-label="Delete rate"
                            icon={<FontAwesomeIcon icon={faTimes} />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            sx={{ backgroundColor: "pink.50" }}
                            onClick={() => rate.id && handleDelete(rate.id)}
                            isDisabled={!rate.id}
                        />
                    </SimpleGrid>
                );
            })}

            {/* New Rate Row */}
            {isAddingRate && (
                <Box mt={4} p={4} borderRadius="md" border="1px dashed" borderColor="orange.300" bg="orange.50">
                    <Text fontSize="sm" fontWeight="600" mb={3} color="orange.600">New Air Freight Rate</Text>
                    <SimpleGrid columns={7} spacing={3} alignItems="center">
                        <Select
                            value={stateOptions.find((o) => o.value === selectedNewState) || null}
                            options={stateOptions}
                            onChange={handleNewStateChange}
                            placeholder="Select State"
                            size="sm"
                        />
                        <Select
                            value={
                                groupedSeafreights[selectedNewState]?.find(
                                    (o) => String(o.value) === String(newRate.seafreight_id)
                                ) || null
                            }
                            options={groupedSeafreights[selectedNewState] || []}
                            onChange={handleNewAreaChange}
                            placeholder="Select Area"
                            isDisabled={!selectedNewState}
                            size="sm"
                        />
                        <Input size="sm" type="number" placeholder="Min KG" value={newRate.min_weight || ""} onChange={(e) => setNewRate({ ...newRate, min_weight: parseNum(e.target.value) })} />
                        <Input size="sm" type="number" placeholder="Max KG" value={newRate.max_weight || ""} onChange={(e) => setNewRate({ ...newRate, max_weight: parseNum(e.target.value) })} />
                        <Input size="sm" type="number" placeholder="Per KG Rate" value={newRate.per_kg_rate || ""} onChange={(e) => setNewRate({ ...newRate, per_kg_rate: parseNum(e.target.value) })} />
                        <Input size="sm" type="number" placeholder="Min Charge" value={newRate.minimum_charge || ""} onChange={(e) => setNewRate({ ...newRate, minimum_charge: parseNum(e.target.value) })} />
                        <IconButton
                            aria-label="Cancel"
                            icon={<FontAwesomeIcon icon={faTimes} />}
                            size="sm"
                            colorScheme="gray"
                            variant="ghost"
                            onClick={() => { setIsAddingRate(false); setNewRate(emptyRate()); setSelectedNewState(""); }}
                        />
                    </SimpleGrid>
                </Box>
            )}

            {/* Save / Cancel */}
            {(isAddingRate || isEditMode) && (
                <Flex mt={5} justifyContent="flex-end">
                    <Button
                        variant="outline"
                        size="sm"
                        mr={3}
                        onClick={() => {
                            setIsAddingRate(false);
                            setIsEditMode(false);
                            setNewRate(emptyRate());
                            setSelectedNewState("");
                            setAirRates([...prevAirRates]);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={saveRates}
                        fontSize="sm"
                        variant="brand"
                        fontWeight="500"
                        size="sm"
                        isDisabled={!hasValidChangesToSave()}
                        isLoading={isSaving}
                    >
                        Save Rates
                    </Button>
                </Flex>
            )}
        </Box>
    );
}

export default AirFreightRateTab;