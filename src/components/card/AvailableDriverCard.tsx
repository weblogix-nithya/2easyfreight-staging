import { Box } from "@chakra-ui/react";
import { faClock } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Driver } from "graphql/driver";
import Image from "next/image";

interface AvailableDriverCardProps {
  driver: Driver;
}

const AvailableDriverCard = ({ driver }: AvailableDriverCardProps) => {
  return (
    <Box className="flex gap-2 items-center py-3 w-full" width="100%">
      <div>
        <Image src={driver?.media_url} alt="driver" height={24} width={24} />
      </div>
      <Box className="flex flex-col w-full">
        <div className="flex justify-between">
          <span className="font-bold text-sm">{driver?.full_name}</span>
          <span className="text-gray-400 text-xs">{driver?.driver_no}</span>
        </div>

        <div className="flex justify-between items-baseline">
          <div>
            <span className="text-green-600">
              {driver.current_occupied_capacity || "0"}
            </span>
            <span>{`/${driver?.no_max_capacity} cbm `}</span>
          </div>
          {driver?.remaining_time && (
            <div className="text-xs text-blue-900 flex items-center">
              <FontAwesomeIcon icon={faClock} className="mr-1" />
              <span>{driver?.remaining_time} left</span>
            </div>
          )}
        </div>
      </Box>
    </Box>
  );
};

export default AvailableDriverCard;
