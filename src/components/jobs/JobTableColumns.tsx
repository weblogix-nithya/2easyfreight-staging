// import { useMutation } from "@apollo/client";
// import { CheckIcon, CloseIcon, EditIcon } from "@chakra-ui/icons";
import {
  Flex,
  Icon,
  // IconButton,
  Link,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Text,
  // Textarea,
  // useToast,
} from "@chakra-ui/react";
import IndeterminateCheckbox from "components/table/IndeterminateCheckbox";
import { DynamicTableUser } from "graphql/dynamicTableUser";
// import { UPDATE_JOB_MUTATION } from "graphql/job";
import {
  formatAddress,
  formatDate,
  formatTime,
  formatToTimeDate,
  outputDynamicTable,
} from "helpers/helper";
import Image from "next/image";
import EditableFieldPopover from "pages/admin/jobs/job-components/EditableFieldPopover";
import React from "react";
import { MdMenu } from "react-icons/md";
// import { useSelector } from "react-redux";
import { RootState } from "store/store";

export const isAdmin = (state: RootState) => state.user.isAdmin;
export const isCustomer = (state: RootState) => state.user.isCustomer;

export const PickupAddressBusinessNameCell = ({ row }: any) => (
  <>
    <Text mb="2" minWidth={"300px"} flexWrap={"nowrap"}>
      {formatAddress(row.original.job.pick_up_destinations)}
    </Text>
    <Text>
      {row.originaljob.pick_up_destination.address_business_name || "-"}
    </Text>
  </>
);
export const JobDestinationsCell = ({ row }: any) => {
  const destinations = row?.original?.job.job_destinations || [];
  const filteredDestinations = destinations.filter(
    (destination: any) => destination?.is_pickup === false,
  );

  const first = filteredDestinations[0];

  return (
    <>
      {first ? (
        <Text whiteSpace="normal" fontSize="sm" minWidth={"170px"}>
          {first.address_line_1}
          {"\n"}
          {first.address_city} {first.address_postal_code}
        </Text>
      ) : (
        <Text>-</Text>
      )}

      {filteredDestinations.length > 1 && (
        <Popover placement="bottom" closeOnBlur={false}>
          <PopoverTrigger>
            <Text color="primary.400" cursor="pointer">
              <strong>View All</strong>
            </Text>
          </PopoverTrigger>
          <PopoverContent color="black" bg="black.100" borderColor="black.100">
            <PopoverHeader color="black" pt={4} fontWeight="bold" border="0">
              Delivery addresses:
            </PopoverHeader>
            <PopoverArrow bg="black.100" />
            <PopoverCloseButton />
            <PopoverBody>
              {filteredDestinations.map((destination: any, index: number) => (
                <Text color="black" mb="5" key={`dest-${index}`}>
                  Address {index + 1}: {formatAddress(destination)}
                </Text>
              ))}
            </PopoverBody>
          </PopoverContent>
        </Popover>
      )}
    </>
  );
};

export const JobDestinationsCellExport = ({ row }: any) => {
  const filteredDestinations = row.original.job.job_destinations.filter(
    (destination: any) => destination.is_pickup === false,
  );

  return formatAddress(filteredDestinations[0]);
};
export const JobDestinationBusinessNameCell = ({ row }: any) => {
  // Add null check and default empty array
  const destinations = row?.original?.job.job_destinations || [];
  const filteredDestinations = destinations.filter(
    (destination: any) => destination?.is_pickup === false,
  );

  return (
    <>
      <Text minW="130px" maxW="170px">
        {filteredDestinations[0]?.address_business_name || "-"}
      </Text>
    </>
  );
};
export const JobDestinationBusinessNameCellExport = ({ row }: any) => {
  const filteredDestinations = row.original.job.job_destinations.filter(
    (destination: any) => destination.is_pickup === false,
  );
  return filteredDestinations[0]?.address_business_name || "-";
};
export const JobDestinationWithBusinessNameCell = ({ row }: any) => {
  const destinations = row?.original?.job?.job_destinations || [];
  const filteredDestinations = destinations.filter(
    (destination: any) => destination?.is_pickup === false,
  );
  const showDeliveryTime =
    row.original.job.job_status.id == 6 || row.original.job.job_status.id == 7;

  // Only get media if not in status 6 or 7
  const normalMedia =
    filteredDestinations[0]?.media?.filter(
      (item: any) => item.collection_name !== "signatures",
    ) || [];

  return (
    <>
      {filteredDestinations[0]?.updated_at && showDeliveryTime && (
        <Text fontSize="sm" color="red.600" mb={1}>
          Delivery time:{" "}
          {formatDate(filteredDestinations[0].updated_at, "HH:mm, DD/MM/YYYY")}
        </Text>
      )}
      <Text isTruncated w={"fit-content"}>
        {filteredDestinations.length > 0
          ? `${filteredDestinations[0].address_line_1}, ${filteredDestinations[0].address_city}, ${filteredDestinations[0].address_postal_code}`
          : "-"}
      </Text>
      <Text>{filteredDestinations[0]?.address_business_name || "-"}</Text>
      {normalMedia.length > 0 && (
        <Flex gap={2} flexWrap="wrap">
          {normalMedia.map((media: any, index: number) => (
            <Link key={`${index+1}`} href={media.downloadable_url} isExternal>
              <Image
                src={media.downloadable_url}
                alt={media.name || "Delivery evidence"}
                width={50}
                height={50}
                style={{
                  objectFit: "cover",
                  borderRadius: "4px",
                  width: "50px", 
                  height: "50px",
                }}
              />
            </Link>
          ))}
        </Flex>
      )}
    </>
  );
};
export const JobDestinationWithBusinessNameCellExport = ({ row }: any) => {
  const filteredDestinations = row.original.job.job_destinations.filter(
    (destination: any) => destination.is_pickup === false,
  );
  const formattedAddress = formatAddress(filteredDestinations[0]);
  const businessName = filteredDestinations[0]?.address_business_name || "-";
  return `${formattedAddress}\n${businessName}`;
};

export const PickupAddressWithTimeCell = ({ row }: any) => {
  const pickupDest = row.original.job.job_destinations?.find(
    (dest: any) => dest.is_pickup === true,
  );
  const showPickupTime =
    row.original.job.job_status.id == 4 ||
    row.original.job.job_status.id == 5 ||
    row.original.job.job_status.id == 6 ||
    row.original.job.job_status.id == 7;
  const normalMedia =
    pickupDest?.media?.filter(
      (item: any) => item.collection_name !== "signatures",
    ) || [];
  return (
    <>
      {pickupDest?.updated_at && showPickupTime && (
        <Text fontSize="sm" color="red.600" mb={1}>
          Collection time:{" "}
          {formatDate(pickupDest.updated_at, "HH:mm, DD/MM/YYYY")}
        </Text>
      )}
      <Text mb="2" minWidth={"300px"} flexWrap={"nowrap"}>
        {`${pickupDest?.address_line_1}, ${pickupDest?.address_city}, ${pickupDest?.address_postal_code}`}
      </Text>
      <Text>{pickupDest?.address_business_name || "-"}</Text>
      {normalMedia.length > 0 && (
        <Flex gap={2} flexWrap="wrap">
          {normalMedia.map((media: any, index: number) => (
            <Link key={index} href={media.downloadable_url} isExternal>
              <Image
                src={media.downloadable_url}
                alt={media.name || "Pickup evidence"}
                width={50}
                height={50}
                style={{
                  objectFit: "cover",
                  borderRadius: "4px",
                  width: "50px", 
                  height: "50px",
                }}
              />
            </Link>
          ))}
        </Flex>
      )}
    </>
  );
};
export const PickupAddressWithTimeCellExport = ({ row }: any) => {
  const pickupDest = row.original.job.job_destinations?.find(
    (dest: any) => dest.is_pickup === true,
  );
  const collectionTime = pickupDest?.updated_at
    ? `Collection time: ${formatDate(
        pickupDest.updated_at,
        "HH:mm, DD/MM/YYYY",
      )}\n`
    : "";

  return `${collectionTime}${formatAddress(
    row.original.job.pick_up_destination,
  )}\n${row.original.job.pick_up_destination?.address_business_name || "-"}`;
};
export const PickupAddressWithTimewithoutMediaCell = ({ row }: any) => {
  const pickupDest = row.original.job.job_destinations?.find(
    (dest: any) => dest.is_pickup === true,
  );
  const showPickupTime =
    row.original.job.job_status.id == 4 ||
    row.original.job.job_status.id == 5 ||
    row.original.job.job_status.id == 6 ||
    row.original.job.job_status.id == 7;

  return (
    <>
      {pickupDest?.updated_at && showPickupTime && (
        <Text fontSize="sm" color="red.600" mb={1}>
          Collection time:{" "}
          {formatDate(pickupDest.updated_at, "HH:mm, DD/MM/YYYY")}
        </Text>
      )}
      <Text mb="2" minWidth={"300px"} flexWrap={"nowrap"}>
        {`${pickupDest?.address_line_1}, ${pickupDest?.address_city}, ${pickupDest?.address_postal_code}`}
      </Text>
      <Text>{pickupDest?.address_business_name || "-"}</Text>
    </>
  );
};
export const JobDestinationWithBusinessNamewithoutMediaCell = ({
  row,
}: any) => {
  const destinations = row?.original?.job?.job_destinations || [];
  const filteredDestinations = destinations.filter(
    (destination: any) => destination?.is_pickup === false,
  );
  const showDeliveryTime =
    row.original.job.job_status.id == 6 || row.original.job.job_status.id == 7;

  return (
    <>
      {filteredDestinations[0]?.updated_at && showDeliveryTime && (
        <Text fontSize="sm" color="red.600" mb={1}>
          Delivery time:{" "}
          {formatDate(filteredDestinations[0].updated_at, "HH:mm, DD/MM/YYYY")}
        </Text>
      )}
      <Text isTruncated w={"fit-content"}>
        {filteredDestinations.length > 0
          ? `${filteredDestinations[0].address_line_1}, ${filteredDestinations[0].address_city}, ${filteredDestinations[0].address_postal_code}`
          : "-"}
      </Text>
      <Text>{filteredDestinations[0]?.address_business_name || "-"}</Text>
    </>
  );
};

export const ReadyDropByCell = ({ row }: any) => {
  return (
    <>
      <Text isTruncated w={"fit-content"}>
        {row.original.job.job_category?.name ?? "-"}
      </Text>
      <Text isTruncated w={"fit-content"}>
        R: {formatToTimeDate(row.original.job.ready_at)}
      </Text>
      <Text isTruncated w={"fit-content"}>
        D: {formatToTimeDate(row.original.job.drop_at)}
      </Text>
    </>
  );
};

export const ReadyDropByCellExport = ({ row }: any) =>
  `${row.original.job.job_category?.name ?? "-"}\n
    R: ${formatTime(row.original.job.ready_at)}\n
    D: ${formatTime(row.original.job.drop_at)}`;

export const NotesCell = ({ row }: any) => {
  const notes = row.original.job.customer_notes ?? null;
  return (
    <>
      <Text
        // minWidth={"300px"}
        maxWidth={"100px"}
        w={"min-content"}
        color="black"
        noOfLines={2}
      >
        {notes ?? "-"}
      </Text>
      {notes && (
        <Popover placement="bottom" closeOnBlur={false}>
          <PopoverTrigger>
            <Text color="primary.400" cursor="pointer" mt={5}>
              <strong>View note</strong>
            </Text>
          </PopoverTrigger>
          <PopoverContent color="black" bg="black.100" borderColor="black.100">
            <PopoverHeader color="black" pt={4} fontWeight="bold" border="0">
              Notes:
            </PopoverHeader>
            <PopoverArrow bg="black.100" />
            <PopoverCloseButton />
            <PopoverBody>
              <Text color="black" mb="5">
                {notes}
              </Text>
            </PopoverBody>
          </PopoverContent>
        </Popover>
      )}
    </>
  );
};
export const ItemsTypeCell = ({ row }: any) => {
  const items = row.original.job.job_items;
  return (
    <div>
      {items.map((item: any) => (
        <Text key={`items-type-${item.id}`} mb={2}>
          {item.item_type.name}
        </Text>
      ))}
    </div>
  );
};
export const ItemsTypeCellExport = ({ row }: any) => {
  const items = row.original.job.job_items;
  return items.map((item: any) => {
    return [`${item.item_type.name}  \n`];
  });
};
export const ItemsDimensionCell = ({ row }: any) => {
  const items = row.original.job.job_items;
  return (
    <div>
      {items.map((item: any) => (
        <Text key={`items-dimension-${item.id}`} mb={2} w={"max-content"}>
          {`${(item.dimension_height * 100)?.toFixed(0)}x${(
            item.dimension_width * 100
          )?.toFixed(0)}x${(item.dimension_depth * 100)?.toFixed(0)}`}
        </Text>
      ))}
    </div>
  );
};
export const ItemsDimensionCellExport = ({ row }: any) => {
  const items = row.original.job.job_items;
  return items.map((item: any) => {
    return [
      `${(item.dimension_height * 100)?.toFixed(2)}cm x `,
      `${(item.dimension_width * 100)?.toFixed(2)}cm x `,
      `${(item.dimension_depth * 100)?.toFixed(2)}cm  \n`,
    ];
  });
};
export const ItemsQuantityCell = ({ row }: any) => {
  const items = row.original.job.job_items;
  return (
    <div>
      {items.map((item: any) => (
        <Text key={`items-quantity-${item.id}`} mb={2}>
          {item?.quantity}
        </Text>
      ))}
    </div>
  );
};
export const ItemsQuantityCellExport = ({ row }: any) => {
  const items = row.original.job.job_items;
  return items.map((item: any) => {
    return [`${item?.quantity}  \n`];
  });
};
export const ItemsWeightCell = ({ row }: any) => {
  const items = row.original.job.job_items;
  return (
    <div>
      {items.map((item: any) => (
        <Text key={`items-weight-${item.id}`} mb={2}>
          {item?.weight}kg
        </Text>
      ))}
    </div>
  );
};
export const ItemsWeightCellExport = ({ row }: any) => {
  const items = row.original.job.job_items;
  return items.map((item: any) => {
    return [`${item?.weight}kg  \n`];
  });
};
export const ItemsCbmCell = ({ row }: any) => {
  const items = row.original.job.job_items;
  return (
    <div>
      {items.map((item: any) => (
        <Text key={`items-cbm-${item.id}`} mb={2}>
          {item.volume?.toFixed(2)}cbm
        </Text>
      ))}
    </div>
  );
};
export const ItemsExtrasCell = ({ row }: any) => {
  return <Text maxW="100px">{row?.original?.job?.extras || "-"}</Text>;
};

export const DriverCell = ({ row }: any) => {
  return <Text>{row?.original?.job?.driver?.full_name || "-"}</Text>;
};
export const ItemsCbmCellExport = ({ row }: any) => {
  const items = row.original.job.job_items;
  return items.map((item: any) => {
    return [`${item.volume?.toFixed(2)}cbm  \n`];
  });
};
export const BookedByCell = ({ row }: any) => {
  const name = row?.original?.job?.company?.name || "-";
  return (
    <Text maxW="150px" minW="100px">
      {name}
    </Text>
  );
};
// export const BookedByCellExport = ({ row }: any) => {
//   const pickupDest = row.original.job_destinations?.find(
//     (dest: any) => dest.is_pickup === true,
//   );
//   const collectionTime = pickupDest?.updated_at
//     ? `Collection time: ${formatDate(
//         pickupDest.updated_at,
//         "HH:mm, DD/MM/YYYY",
//       )}\n`
//     : "";

//   return `${collectionTime}${formatAddress(
//     row.original.pick_up_destination,
//   )}\n${row.original.pick_up_destination?.address_business_name || "-"}`;
// };
export const JobTypeCell: React.FC<{
  row: { original: { job: { job_type?: { name: string } } } };
}> = ({ row }) => {
  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "standard":
        return "purple.500";
      case "urgent":
        return "red.500";
      case "express":
        return "orange.500";
      default:
        return "purple.500";
    }
  };

  return (
    <Text
      color={getTypeColor(row.original.job?.job_type?.name)}
      fontWeight="bold"
    >
      {row.original.job?.job_type?.name || "-"}
    </Text>
  );
};
export const StatusCell = ({ row }: any) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "scheduled":
        return "blue.500";
      case "unassigned":
        return "gray.500";
      case "in transit":
        return "green.400";
      case "en route for pickup":
        return "orange.400";
      case "assigned":
        return "purple.400";
      default:
        return "black";
    }
  };

  return (
    <Text
      color={getStatusColor(row?.original?.job?.job_status?.name)}
      fontWeight="bold"
    >
      {row?.original?.job?.job_status?.name || "-"}
    </Text>
  );
};

export const ReadyAtCell = ({ row }: any) => {
  return (
    <Text maxW="150px" minW="100px">
      {row?.original?.job?.ready_at || "-"}
    </Text>
  );
};
export const LastFreeAtCell = ({ row }: any) => {
  // console.log(row.original.job,"sa")
  return (
    <Text maxW="150px" minW="150px">
      {row?.original?.job?.last_free_at || "-"}
    </Text>
  );
};
export const PickupBusinessNameCell = ({ row }: any) => {
  const pickupDest = row.original.job.job_destinations?.find(
    (dest: any) => dest.is_pickup === true,
  );
  return (
    <Text maxW="150px" minW="100px">
      {pickupDest?.address_business_name || "-"}
    </Text>
  );
};

export const PickupAddressCell = ({ row }: any) => {
  const pickup = row.original.job.job_destinations?.find(
    (d: any) => d.is_pickup === true,
  );

  if (!pickup) return <>-</>;

  const line1 = pickup.address_line_1;
  const line2 = `${pickup.address_city} ${pickup.address_postal_code}, Australia`;

  return (
    <Text whiteSpace="normal" fontSize="sm" minWidth={"170px"}>
      {line1}
      {"\n"}
      {line2}
    </Text>
  );
};

export const CustomerReferenceCell = ({ row }: any) => {
  return (
    <Text maxW="100px" noOfLines={2}>
      {" "}
      {row?.original?.job?.reference_no || "-"}
    </Text>
  );
};

export const CategoryCell = ({ row }: any) => {
  return (
    <Text maxW="100px">{row?.original?.job?.job_category?.name || "-"}</Text>
  );
};

export const DeliveryCell = ({ row }: any) => {
  return <Text maxW="100px">{row?.original?.job?.name || "-"}</Text>;
};

export const AdminNotesCell = ({ row }: any) => {
  const [display, setDisplay] = React.useState(
    row?.original?.job?.admin_notes ?? ""
  );

  return (
    <Flex gap={2} align="center">
      <Text maxW="200px" noOfLines={2}>{display || "-"}</Text>
      <EditableFieldPopover
        row={row}
        field="admin_notes"
        multiline
        triggerAriaLabel="Edit admin notes"
        onSaved={setDisplay}
      />
    </Flex>
  );
};

export const TimeslotCell = ({ row }: any) => {
  const [display, setDisplay] = React.useState(
    row?.original?.job?.timeslot ?? ""
  );

  return (
    <Flex gap={2} align="center">
      <Text maxW="140px" noOfLines={1}>{display || "-"}</Text>
      <EditableFieldPopover
        row={row}
        field="timeslot"
        triggerAriaLabel="Edit timeslot"
        onSaved={setDisplay}
      />
    </Flex>
  );
};

const MEDIA_CELL: Record<
  string, 
  { with: any; without: any }
> = {
  "pick_up_destination.address_formatted,pick_up_destination.address_business_name": {
    with: PickupAddressWithTimeCell,
    without: PickupAddressWithTimewithoutMediaCell,
  },
  "job_destinations.address,job_destinations.address_business_name": {
    with: JobDestinationWithBusinessNameCell,
    without: JobDestinationWithBusinessNamewithoutMediaCell,
  },
};

// Replace the Cell for specific columns based on withMedia flag
function applyMediaCells(cols: any[], withMedia: boolean): any[] {
  return cols.map((col) => {
    const media = MEDIA_CELL[col.id];
    if (!media) return col;
    return {
      ...col,
      Cell: withMedia ? media.with : media.without,
    };
  });
}

// de-dupe helper (keeps first occurrence)
function uniqueById(cols: any[]): any[] {
  const seen = new Set<string>();
  return cols.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));
}

// export const columnsWithoutMedia = [
//   {
//     id: "pick_up_destination.address_formatted,pick_up_destination.address_business_name",
//     Header: "Pickup Address and Name",
//     Cell: PickupAddressWithTimewithoutMediaCell, // Cell without media
//   },
//   {
//     id: "job_destinations.address,job_destinations.address_business_name",
//     Header: "Delivery Address and Names",
//     Cell: JobDestinationWithBusinessNamewithoutMediaCell, // Cell without media
//   },
// ];

// export const columnsWithMedia = [
//   {
//     id: "pick_up_destination.address_formatted,pick_up_destination.address_business_name",
//     Header: "Pickup Address and Name",
//     Cell: PickupAddressWithTimeCell, // Cell with media
//   },
//   {
//     id: "job_destinations.address,job_destinations.address_business_name",
//     Header: "Delivery Address and Name",
//     Cell: JobDestinationWithBusinessNameCell, // Cell with media
//   },
// ];

export const tableColumn = [
  {
    id: "name",
    Header: "Delivery ID",
    Cell: DeliveryCell,
    // width: "100px",
  },
  {
    id: "company.name",
    Header: "Booked By",
    Cell: BookedByCell, // Use the new cell component
    // CellExport: BookedByCellExport,
  },
  {
    id: "reference_no",
    Header: "Customer Reference",
    Cell: CustomerReferenceCell,
  },
  {
    id: "job_category.name",
    Header: "category",
    Cell: CategoryCell,
  },
  {
    id: "job_type.name",
    Header: "Type",
    Cell: JobTypeCell, // Add this line
    // width: "100px",
  },
  {
    id: "job_status.name",
    Header: "Status",
    Cell: StatusCell, // Add this line
    // width: "100px",
  },
  {
    id: "ready_at",
    Header: "Date",
    Cell: ReadyAtCell, // Add this line
    // type: "date",
  },
  {
    id: "pick_up_destination.address_formatted",
    Header: "Pickup From",
    Cell: PickupAddressCell, // Add this line
    // width: "150px",
  },
  // {
  //   id: "pick_up_destination.address_formatted,pick_up_destination.address_business_name",
  //   Header: "Pickup Address and Name ",
  //   // width: "200px",
  //   Cell: PickupAddressWithTimewithoutMediaCell, // Use the new cell component
  //   CellExport: PickupAddressWithTimeCellExport,
  // },
  {
    id: "pick_up_destination.address_business_name",
    Header: "Pickup Business Name",
    Cell: PickupBusinessNameCell, // Add this line
  },
  {
    id: "job_destinations.address",
    Header: "Delivery Address", 
    width: "100px",
    Cell: JobDestinationsCell,
    CellExport: JobDestinationsCellExport,
  },
  {
    id: "job_destinations.address_business_name",
    Header: "Delivery Business Name",
    Cell: JobDestinationBusinessNameCell,
    CellExport: JobDestinationBusinessNameCellExport,
  },
  // {
  //   id: "job_destinations.address,job_destinations.address_business_name",
  //   Header: "Delivery Address and Name",
  //   Cell: JobDestinationWithBusinessNamewithoutMediaCell,
  //   CellExport: JobDestinationWithBusinessNameCellExport,
  // },
  {
    id: "job_category.name,ready_at,drop_at",
    Header: "Ready By / Drop by",
    Cell: ReadyDropByCell,
    CellExport: ReadyDropByCellExport,
  },
  {
    id: "timeslot",
    Header: "Timeslot",
    Cell: TimeslotCell, // Add this line
    // width: "50px",
  },
  {
    id: "last_free_at",
    Header: "Last Free Day",
    Cell: LastFreeAtCell, // Add this line
    // type: "date",
  },
  {
    id: "job_items.item_type",
    Header: "Item Type",
    Cell: ItemsTypeCell,
    CellExport: ItemsTypeCellExport,
  },
  {
    id: "job_items.dimensions",
    Header: "Dimensions",
    Cell: ItemsDimensionCell,
    CellExport: ItemsDimensionCellExport,
  },
  {
    id: "job_items.quantity",
    Header: "Quantity",
    Cell: ItemsQuantityCell,
    CellExport: ItemsQuantityCellExport,
  },
  {
    id: "job_items.weight",
    Header: "Weight",
    Cell: ItemsWeightCell,
    CellExport: ItemsWeightCellExport,
  },
  {
    id: "job_items.volume",
    Header: "CBM",
    Cell: ItemsCbmCell,
    CellExport: ItemsCbmCellExport,
  },
  {
    id: "extras",
    Header: "Extras",
    Cell: ItemsExtrasCell,
    // width: "100px",
  },
  {
    id: "customer_notes",
    Header: "Client notes",
    Cell: NotesCell,
  },
  {
    id: "driver.full_name",
    Header: "Drivers",
    Cell: DriverCell,
    enableSorting: true,
  },
  {
    id: "admin_notes",
    Header: "Admin Notes",
    accessor: "admin_notes" as const,
    Cell: AdminNotesCell,
    // show: isCustomer,
  },
];

export const getColumns = (
  isAdmin: boolean,
  isCustomer: boolean,
  withMedia: boolean,
  dynamicTableUsers?: DynamicTableUser[], // required by outputDynamicTable
) => {
  // 1) Selection checkbox column
  const base: any[] = [
    {
      id: "selection",
      Header: ({ getToggleAllRowsSelectedProps }: any) => (
        <div>
          <IndeterminateCheckbox
            {...getToggleAllRowsSelectedProps()}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ),
      Cell: ({ row }: any) => (
        <div>
          <IndeterminateCheckbox
            {...row.getToggleRowSelectedProps()}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ),
    },
  ];

  // 2) If no config yet, show your default tableColumn only
  if (!dynamicTableUsers || dynamicTableUsers.length === 0) {
    const cols = uniqueById([
      ...base,
      ...tableColumn, // your static defaults
      {
        id: "actions",
        Header: "Actions",
        accessor: "id" as const,
        isView: isCustomer,
        isEdit: isAdmin,
        isTracking: isCustomer,
      },
    ]);
    // Swap Cells for the special two if they exist in tableColumn
    return applyMediaCells(cols, withMedia);
  }

  // 3) Build from dynamic selection
  // NOTE: outputDynamicTable should only include columns that are active:true.
  let columns = [
    ...base,
    ...outputDynamicTable(dynamicTableUsers, tableColumn),
  ];

  // 4) Swap only the Cell for the 2 special fields based on withMedia
  columns = applyMediaCells(columns, withMedia);

  // 5) Ensure Actions at the end and de-dupe
  columns = uniqueById([
    ...columns,
    {
      id: "actions",
      Header: "Actions",
      accessor: "id" as const,
      isView: isCustomer,
      isEdit: isAdmin,
      isTracking: isCustomer,
    },
  ]);

  return columns;
};


export const getBulkAssignColumns = (
  isAdmin: boolean,
  isCustomer: boolean,
  dynamicTableUsers?: DynamicTableUser[],
) => {
  if (dynamicTableUsers === undefined || dynamicTableUsers.length === 0) {
    return [
      {
        id: "order",
        Header: "",
        Cell: ({ _row }: any) => (
          <div>
            <Icon mt="auto" mb="auto" as={MdMenu} h="16px" w="16px" me="8px" />
          </div>
        ),
      },
      ...tableColumn,
      {
        id: "actions",
        Header: "Actions",
        accessor: "id" as const,
        isView: isCustomer,
        isEdit: isAdmin,
        isTracking: isCustomer,
      },
    ];
  }

  const dynamicColumns = outputDynamicTable(dynamicTableUsers, tableColumn);

  var columns: any[] = [
    {
      id: "order",
      Header: "",
      Cell: ({ _row }: any) => (
        <div>
          <Icon as={MdMenu} h="16px" w="16px" me="8px" />
        </div>
      ),
    },
  ];

  columns.push(...dynamicColumns);

  return columns;
};
