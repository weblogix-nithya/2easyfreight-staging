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
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
} from "@chakra-ui/react";
import { faTimes } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Select } from "chakra-react-select";
import {
  CompanyRate,
  CREATE_COMPANY_RATE_MUTATION,
  DELETE_COMPANY_RATE_MUTATION,
  GET_COMPANY_RATE_QUERY,
  GET_LIST_OF_SEAFREIGHTS,
  UPDATE_COMPANY_RATE_MUTATION,
} from "graphql/CompanyRate";
import {
  AirFreightCompanyRate as CompanyRateAirFreight,
  CREATE_AIR_FREIGHT_COMPANY_RATE,
  DELETE_AIR_FREIGHT_COMPANY_RATE,
  GET_AIR_RATES_BY_COMPANY,
  UPDATE_AIR_FREIGHT_COMPANY_RATE,
} from "graphql/CompanyRateAirFreight";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

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

const TAB_PARAM = "rate_tab";
const TAB_VALUES = ["lcl", "air"] as const;
type TabValue = (typeof TAB_VALUES)[number];

// ─── LCL Rate Tab ─────────────────────────────────────────────────────────────

function LCLRateTab({ company_id }: Props) {
  const toast = useToast();

  const [companyRates, setCompanyRates] = useState<CompanyRate[]>([]);
  const [prevCompanyRates, setPrevCompanyRates] = useState<CompanyRate[]>([]);
  const [groupedSeafreights, setGroupedSeafreights] = useState<GroupedSeafreights>({});
  const [stateOptions, setStateOptions] = useState<{ value: string; label: string }[]>([]);
  const [isAddingRate, setIsAddingRate] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedState, setSelectedState] = useState("");

  const emptyRate = (): Partial<CompanyRate> => ({
    company_id: String(company_id),
    seafreight_id: null,
    area: "",
    cbm_rate: 0,
    minimum_charge: 0,
    state: "",
  });

  const [companyRate, setCompanyRate] = useState<Partial<CompanyRate>>(emptyRate());

  const { refetch: getCompanyRates } = useQuery(GET_COMPANY_RATE_QUERY, {
    variables: { company_id },
    skip: !company_id,
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      if (data?.getRatesByCompany) {
        setCompanyRates([...data.getRatesByCompany]);
        setPrevCompanyRates([...data.getRatesByCompany]);
      }
    },
  });

  useQuery(GET_LIST_OF_SEAFREIGHTS, {
    onCompleted(data) {
      const grouped = data.allSeafreights.reduce(
        (acc: GroupedSeafreights, item: any) => {
          if (!acc[item.state]) acc[item.state] = [];
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
      setStateOptions(Object.keys(grouped).map((s) => ({ value: s, label: s })));
    },
    onError(error) {
      toast({ title: "Error fetching seafreights", description: error.message, status: "error", duration: 5000, isClosable: true });
    },
  });

  useEffect(() => {
    if (company_id) getCompanyRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company_id]);

  const [createCompanyRate] = useMutation(CREATE_COMPANY_RATE_MUTATION);
  const [updateCompanyRate] = useMutation(UPDATE_COMPANY_RATE_MUTATION);
  const [deleteCompanyRate] = useMutation(DELETE_COMPANY_RATE_MUTATION);

  const isRegionAlreadyUsed = (state: string, region: string) =>
    companyRates.some((r) => r.state === state && r.area === region);

  const handleStateChange = (selected: any) => {
    setSelectedState(selected.value);
    setCompanyRate({ ...emptyRate(), state: selected.value });
  };

  const handleRegionChange = (selected: any) => {
    const sf = groupedSeafreights[selectedState]?.find((i) => i.value === selected.value);
    if (!sf) return;
    if (isRegionAlreadyUsed(selectedState, sf.label)) {
      toast({ title: "Duplicate Entry", description: `A rate for ${sf.label} in ${selectedState} already exists`, status: "error", duration: 3000, isClosable: true });
      return;
    }
    setCompanyRate({ ...companyRate, seafreight_id: selected.value, area: sf.label, cbm_rate: sf.cbm_rate, minimum_charge: sf.min_charge });
  };

  const handleRateInputChange = (index: number, field: string, value: any) => {
    const updated = [...companyRates];
    updated[index] = { ...updated[index], [field]: field === "cbm_rate" || field === "minimum_charge" ? parseFloat(value) || 0 : value };
    setCompanyRates(updated);
    setIsEditMode(true);
  };

  const hasValidChangesToSave = () => {
    if (isAddingRate) {
      return !!(companyRate.area && companyRate.state && companyRate.seafreight_id && companyRate.cbm_rate > 0 && companyRate.minimum_charge > 0);
    }
    return companyRates.some((rate) => {
      const prev = prevCompanyRates.find((p) => p.id === rate.id);
      return prev && (prev.area !== rate.area || prev.cbm_rate !== rate.cbm_rate || prev.minimum_charge !== rate.minimum_charge || prev.state !== rate.state || prev.seafreight_id !== rate.seafreight_id);
    });
  };

  const refreshRates = async () => {
    const { data } = await getCompanyRates({ company_id });
    if (data?.getRatesByCompany) {
      setCompanyRates(data.getRatesByCompany);
      setPrevCompanyRates(data.getRatesByCompany);
    }
  };

  const saveRates = async () => {
    try {
      setIsSaving(true);
      if (isAddingRate) {
        if (!companyRate.area || !companyRate.state || !companyRate.seafreight_id || companyRate.cbm_rate === 0 || companyRate.minimum_charge === 0) {
          toast({ title: "Validation Error", description: "Please fill in all fields before saving", status: "error", duration: 3000, isClosable: true });
          return;
        }
        await createCompanyRate({ variables: { company_id: String(company_id), seafreight_id: String(companyRate.seafreight_id), area: companyRate.area, cbm_rate: Number(companyRate.cbm_rate), minimum_charge: Number(companyRate.minimum_charge), state: companyRate.state } });
      } else if (isEditMode) {
        const modified = companyRates.filter((rate) => {
          const prev = prevCompanyRates.find((p) => p.id === rate.id);
          return prev && (prev.area !== rate.area || prev.cbm_rate !== rate.cbm_rate || prev.minimum_charge !== rate.minimum_charge || prev.state !== rate.state || prev.seafreight_id !== rate.seafreight_id);
        });
        const invalid = modified.find((r) => !r.area || !r.state || !r.seafreight_id || r.cbm_rate === 0 || r.minimum_charge === 0);
        if (invalid) { toast({ title: "Validation Error", description: "Please ensure all fields are filled for modified rates", status: "error", duration: 3000, isClosable: true }); return; }
        for (const rate of modified) {
          await updateCompanyRate({ variables: { id: rate.id, company_id: String(company_id), seafreight_id: rate.seafreight_id, area: rate.area, cbm_rate: parseFloat(rate.cbm_rate.toString()), minimum_charge: parseFloat(rate.minimum_charge.toString()), state: rate.state } });
        }
      }
      await refreshRates();
      setCompanyRate(emptyRate());
      setSelectedState("");
      setIsAddingRate(false);
      setIsEditMode(false);
      toast({ title: isAddingRate ? "New rate added successfully" : "Rates updated successfully", status: "success", duration: 3000, isClosable: true });
    } catch (error) {
      toast({ title: "Error saving rates", description: error instanceof Error ? error.message : "Unknown error", status: "error", duration: 3000, isClosable: true });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRate = async (rateId: string) => {
    try {
      await deleteCompanyRate({ variables: { id: rateId } });
      await refreshRates();
      toast({ title: "Rate deleted successfully", status: "success", duration: 3000, isClosable: true });
    } catch (error) {
      toast({ title: "Error deleting rate", description: error instanceof Error ? error.message : "Unknown error", status: "error", duration: 3000, isClosable: true });
    }
  };

  return (
    <Box>
      <Flex justifyContent="flex-end" mb={4}>
        <Button onClick={() => { setIsAddingRate(true); setCompanyRate(emptyRate()); setSelectedState(""); }} fontSize="sm" variant="brand" fontWeight="500" isDisabled={isAddingRate}>
          + Add Rate
        </Button>
      </Flex>

      {isAddingRate && (
        <Box mt={4} p={4} borderRadius="md" border="1px dashed" borderColor="blue.300" bg="blue.50">
          <Text fontSize="sm" fontWeight="600" mb={3} color="blue.600">New Rate</Text>
          <SimpleGrid columns={5} spacing={4} alignItems="center">
            <Select value={stateOptions.find((o) => o.value === selectedState) || null} options={stateOptions} onChange={handleStateChange} placeholder="Select State" size="sm" />
            <Select value={groupedSeafreights[selectedState]?.find((o: any) => o.value === companyRate.seafreight_id) || null} options={groupedSeafreights[selectedState] || []} onChange={handleRegionChange} placeholder="Select Region" isDisabled={!selectedState} size="sm" />
            <Input type="number" placeholder="CBM Rate" value={companyRate.cbm_rate || ""} size="sm" onChange={(e) => setCompanyRate({ ...companyRate, cbm_rate: parseFloat(e.target.value) })} />
            <Input type="number" placeholder="Min Charge" value={companyRate.minimum_charge || ""} size="sm" onChange={(e) => setCompanyRate({ ...companyRate, minimum_charge: parseFloat(e.target.value) })} />
            <IconButton aria-label="Cancel new rate" icon={<FontAwesomeIcon icon={faTimes} />} size="sm" colorScheme="gray" variant="ghost" onClick={() => { setIsAddingRate(false); setCompanyRate(emptyRate()); setSelectedState(""); }} />
          </SimpleGrid>
        </Box>
      )}

      {(isAddingRate || isEditMode) && (
        <Flex mt={5} justifyContent="flex-end">
          <Button variant="outline" size="sm" mr={3} onClick={() => { setIsAddingRate(false); setIsEditMode(false); setCompanyRate(emptyRate()); setSelectedState(""); setCompanyRates([...prevCompanyRates]); }}>Cancel</Button>
          <Button onClick={saveRates} fontSize="sm" variant="brand" fontWeight="500" size="sm" isDisabled={!hasValidChangesToSave()} isLoading={isSaving}>Save Rates</Button>
        </Flex>
      )}

      <Grid templateColumns="1fr 1fr 1fr 1fr 40px" gap={4} mb={2} px={1}>
        {["STATE", "QUADRANT", "CBM RATE", "MIN CHARGE", ""].map((h, i) => (
          <Text key={i} fontSize="xs" fontWeight="700" color="gray.500">{h}</Text>
        ))}
      </Grid>
      <Divider mb={4} />

      {companyRates.length === 0 && !isAddingRate && (
        <Text fontSize="sm" color="gray.400" textAlign="center" py={6}>No LCL rates found. Click &quot;+ Add Rate&quot; to create one.</Text>
      )}

      {companyRates.map((rate, index) => (
        <SimpleGrid key={rate.id || index} columns={5} spacing={4} mb={3} alignItems="center">
          <FormControl>
            <Select value={{ value: rate.state, label: rate.state }} options={stateOptions} onChange={(selected) => { const updated = [...companyRates]; updated[index] = { ...rate, state: selected.value, seafreight_id: null, area: "", cbm_rate: 0, minimum_charge: 0 }; setCompanyRates(updated); setIsEditMode(true); }} size="sm" />
          </FormControl>
          <FormControl>
            <Select value={{ value: rate.seafreight_id, label: rate.area }} options={groupedSeafreights[rate.state] || []} onChange={(selected) => { const sf = groupedSeafreights[rate.state]?.find((s: any) => s.value === selected.value); if (sf) { handleRateInputChange(index, "seafreight_id", selected.value); handleRateInputChange(index, "area", sf.label); handleRateInputChange(index, "cbm_rate", sf.cbm_rate); handleRateInputChange(index, "minimum_charge", sf.min_charge); } }} isDisabled={!rate.state} size="sm" />
          </FormControl>
          <FormControl><Input type="number" value={rate.cbm_rate} size="sm" onChange={(e) => handleRateInputChange(index, "cbm_rate", e.target.value)} /></FormControl>
          <FormControl><Input type="number" value={rate.minimum_charge} size="sm" onChange={(e) => handleRateInputChange(index, "minimum_charge", e.target.value)} /></FormControl>
          <IconButton aria-label="Delete rate" icon={<FontAwesomeIcon icon={faTimes} />} size="sm" colorScheme="red" variant="ghost" sx={{ backgroundColor: "pink.50" }} onClick={() => rate.id && handleDeleteRate(rate.id)} isDisabled={!rate.id} />
        </SimpleGrid>
      ))}
    </Box>
  );
}

// ─── Air Freight Rate Tab ─────────────────────────────────────────────────────

function AirFreightRateTab({ company_id }: Props) {
  const toast = useToast();

  // ── Seafreight state/area data ────────────────────────────────────────────
  const [groupedSeafreights, setGroupedSeafreights] = useState<GroupedSeafreights>({});
  const [stateOptions, setStateOptions] = useState<{ value: string; label: string }[]>([]);

  // State selected for the "Add New Rate" row
  const [selectedNewState, setSelectedNewState] = useState("");

  // Per-row state tracking for existing rates (index → selected state string)
  const [rowStates, setRowStates] = useState<Record<number, string>>({});

  // Same GET_LIST_OF_SEAFREIGHTS query — reused for Air Freight State/Area dropdowns
  useQuery(GET_LIST_OF_SEAFREIGHTS, {
    onCompleted(data) {
      const grouped = data.allSeafreights.reduce(
        (acc: GroupedSeafreights, item: any) => {
          if (!acc[item.state]) acc[item.state] = [];
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
      setStateOptions(Object.keys(grouped).map((s) => ({ value: s, label: s })));
    },
    onError(error) {
      toast({ title: "Error fetching states", description: error.message, status: "error", duration: 5000, isClosable: true });
    },
  });

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

  const [airRates, setAirRates] = useState<CompanyRateAirFreight[]>([]);
  const [prevAirRates, setPrevAirRates] = useState<CompanyRateAirFreight[]>([]);
  const [isAddingRate, setIsAddingRate] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newRate, setNewRate] = useState<Partial<CompanyRateAirFreight>>(emptyRate());

  const { refetch: refetchAirRates } = useQuery(GET_AIR_RATES_BY_COMPANY, {
    variables: { company_id },
    skip: !company_id,
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      if (data?.getAirRatesByCompany) {
        const rates = [...data.getAirRatesByCompany];
        setAirRates(rates);
        setPrevAirRates(rates);
        // seed rowStates from loaded data
        const rs: Record<number, string> = {};
        rates.forEach((r: CompanyRateAirFreight, i: number) => { if (r.state) rs[i] = r.state; });
        setRowStates(rs);
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

  const [createAirRate] = useMutation(CREATE_AIR_FREIGHT_COMPANY_RATE);
  const [updateAirRate] = useMutation(UPDATE_AIR_FREIGHT_COMPANY_RATE);
  const [deleteAirRate] = useMutation(DELETE_AIR_FREIGHT_COMPANY_RATE);

  const parseNum = (v: any) => parseFloat(v) || 0;

  const refreshRates = async () => {
    const { data } = await refetchAirRates({ company_id });
    if (data?.getAirRatesByCompany) {
      const rates = [...data.getAirRatesByCompany];
      setAirRates(rates);
      setPrevAirRates(rates);
      const rs: Record<number, string> = {};
      rates.forEach((r: CompanyRateAirFreight, i: number) => { if (r.state) rs[i] = r.state; });
      setRowStates(rs);
    }
  };

  // Existing row — numeric field change
  const handleInputChange = (index: number, field: keyof CompanyRateAirFreight, value: any) => {
    const numericFields: (keyof CompanyRateAirFreight)[] = ["min_weight", "max_weight", "per_kg_rate", "per_km_rate", "cbm_rate", "minimum_charge", "fuel_surcharge"];
    const updated = [...airRates];
    updated[index] = { ...updated[index], [field]: numericFields.includes(field) ? parseNum(value) : value };
    setAirRates(updated);
    setIsEditMode(true);
  };

  // Existing row — state dropdown changed → reset area
  const handleRowStateChange = (index: number, newState: string) => {
    setRowStates({ ...rowStates, [index]: newState });
    const updated = [...airRates];
    updated[index] = { ...updated[index], state: newState, area: "" };
    setAirRates(updated);
    setIsEditMode(true);
  };

  // Existing row — area dropdown changed
  const handleRowAreaChange = (index: number, selected: any) => {
    const currentState = rowStates[index] ?? airRates[index]?.state;
    const sf = groupedSeafreights[currentState]?.find((s) => s.value === selected.value);
    if (!sf) return;
    const updated = [...airRates];
    updated[index] = {
      ...updated[index],
      area: sf.label,
      seafreight_id: String(sf.value), // ← இதை add பண்ணு
    };
    setAirRates(updated);
    setIsEditMode(true);
  };

  // New row — state dropdown changed → reset area
  const handleNewStateChange = (selected: any) => {
    setSelectedNewState(selected.value);
    setNewRate({ ...newRate, state: selected.value, area: "" });
  };

  // New row — area dropdown changed
  const handleNewAreaChange = (selected: any) => {
    const sf = groupedSeafreights[selectedNewState]?.find((s) => s.value === selected.value);
    if (!sf) return;
    setNewRate({
      ...newRate,
      area: sf.label,
      seafreight_id: String(sf.value), // ← இதை add பண்ணு
    });
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

  return (
    <Box>
      <Flex justifyContent="flex-end" mb={4}>
        <Button onClick={() => { setIsAddingRate(true); setNewRate(emptyRate()); setSelectedNewState(""); }} fontSize="sm" variant="brand" fontWeight="500" isDisabled={isAddingRate}>
          + Add Rate
        </Button>
      </Flex>

      {/* Table Header */}
      <Grid templateColumns="1fr 1fr 1fr 1fr 1fr 1fr 1fr 40px" gap={3} mb={2} px={1}>
        {["STATE", "AREA / AIRPORT", "MIN KG", "MAX KG", "PER KG", "MIN CHARGE", "FUEL SURCHARGE", ""].map((h, i) => (
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
      {airRates.map((rate, index) => {
        const currentState = rowStates[index] ?? rate.state ?? "";
        const areaOptions = groupedSeafreights[currentState] || [];
        const selectedArea = areaOptions.find((o) => o.label === rate.area) || (rate.area ? { value: rate.area, label: rate.area } : null);

        return (
          <SimpleGrid key={rate.id || index} columns={8} spacing={3} mb={3} alignItems="center">
            {/* State dropdown */}
            <FormControl>
              <Select
                value={stateOptions.find((o) => o.value === currentState) || null}
                options={stateOptions}
                onChange={(selected) => handleRowStateChange(index, selected.value)}
                placeholder="State"
                size="sm"
              />
            </FormControl>

            {/* Area dropdown — filtered by selected state */}
            <FormControl>
              <Select
                value={selectedArea}
                options={areaOptions}
                onChange={(selected) => handleRowAreaChange(index, selected)}
                placeholder="Area / Airport"
                isDisabled={!currentState}
                size="sm"
              />
            </FormControl>

            <Input size="sm" type="number" value={rate.min_weight ?? ""} placeholder="0" onChange={(e) => handleInputChange(index, "min_weight", e.target.value)} />
            <Input size="sm" type="number" value={rate.max_weight ?? ""} placeholder="0" onChange={(e) => handleInputChange(index, "max_weight", e.target.value)} />
            <Input size="sm" type="number" value={rate.per_kg_rate ?? ""} placeholder="0.00" onChange={(e) => handleInputChange(index, "per_kg_rate", e.target.value)} />
            <Input size="sm" type="number" value={rate.minimum_charge ?? ""} placeholder="0.00" onChange={(e) => handleInputChange(index, "minimum_charge", e.target.value)} />
            <Input size="sm" type="number" value={rate.fuel_surcharge ?? ""} placeholder="0.00" onChange={(e) => handleInputChange(index, "fuel_surcharge", e.target.value)} />
            <IconButton aria-label="Delete rate" icon={<FontAwesomeIcon icon={faTimes} />} size="sm" colorScheme="red" variant="ghost" sx={{ backgroundColor: "pink.50" }} onClick={() => rate.id && handleDelete(rate.id)} isDisabled={!rate.id} />
          </SimpleGrid>
        );
      })}

      {/* New Rate Row */}
      {isAddingRate && (
        <Box mt={4} p={4} borderRadius="md" border="1px dashed" borderColor="orange.300" bg="orange.50">
          <Text fontSize="sm" fontWeight="600" mb={3} color="orange.600">New Air Freight Rate</Text>
          <SimpleGrid columns={8} spacing={3} alignItems="center">
            {/* State dropdown */}
            <Select
              value={stateOptions.find((o) => o.value === selectedNewState) || null}
              options={stateOptions}
              onChange={handleNewStateChange}
              placeholder="Select State"
              size="sm"
            />

            {/* Area dropdown — filtered by selected state */}
            <Select
              value={groupedSeafreights[selectedNewState]?.find((o) => o.label === newRate.area) || null}
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
            <Input size="sm" type="number" placeholder="Fuel Surcharge" value={newRate.fuel_surcharge || ""} onChange={(e) => setNewRate({ ...newRate, fuel_surcharge: parseNum(e.target.value) })} />
            <IconButton aria-label="Cancel" icon={<FontAwesomeIcon icon={faTimes} />} size="sm" colorScheme="gray" variant="ghost" onClick={() => { setIsAddingRate(false); setNewRate(emptyRate()); setSelectedNewState(""); }} />
          </SimpleGrid>
        </Box>
      )}

      {/* Save / Cancel */}
      {(isAddingRate || isEditMode) && (
        <Flex mt={5} justifyContent="flex-end">
          <Button variant="outline" size="sm" mr={3} onClick={() => { setIsAddingRate(false); setIsEditMode(false); setNewRate(emptyRate()); setSelectedNewState(""); setAirRates([...prevAirRates]); }}>
            Cancel
          </Button>
          <Button onClick={saveRates} fontSize="sm" variant="brand" fontWeight="500" size="sm" isDisabled={!hasValidChangesToSave()} isLoading={isSaving}>
            Save Rates
          </Button>
        </Flex>
      )}
    </Box>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

function CompanyRateTab({ company_id }: Props) {
  const router = useRouter();

  const tabFromUrl = router.query[TAB_PARAM] as TabValue | undefined;
  const activeTabIndex = TAB_VALUES.indexOf(tabFromUrl ?? "lcl");
  const safeIndex = activeTabIndex === -1 ? 0 : activeTabIndex;

  const handleTabChange = (index: number) => {
    router.replace(
      { pathname: router.pathname, query: { ...router.query, [TAB_PARAM]: TAB_VALUES[index] } },
      undefined,
      { shallow: true },
    );
  };

  return (
    <Box pt={8} pb={10}>
      <Flex justifyContent="space-between" alignItems="center" mb="24px">
        <h2 className="mb-0">Company Rates</h2>
      </Flex>
      <Divider mb={6} />
      <Tabs variant="enclosed" colorScheme="blue" index={safeIndex} onChange={handleTabChange}>
        <TabList>
          <Tab fontWeight="600" fontSize="sm">🚢 LCL</Tab>
          <Tab fontWeight="600" fontSize="sm">✈️ Air Freight</Tab>
        </TabList>
        <TabPanels>
          <TabPanel px={0} pt={6}><LCLRateTab company_id={company_id} /></TabPanel>
          <TabPanel px={0} pt={6}><AirFreightRateTab company_id={company_id} /></TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

export default CompanyRateTab;