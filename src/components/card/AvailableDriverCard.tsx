import { Avatar, Box } from "@chakra-ui/react";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Driver } from "graphql/driver";
import Image from "next/image";
import { useEffect, useState } from "react";

interface AvailableDriverCardProps {
  driver: Driver;
}

const AvailableDriverCard = ({ driver }: AvailableDriverCardProps) => {
  async function checkImageExists(url: string): Promise<boolean> {
    try {
      const res = await fetch(url, { method: "HEAD" });
      return res.ok;
    } catch {
      return false;
    }
  }
  const [_imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (driver?.media_url) {
      checkImageExists(driver.media_url).then((exists) => {
        if (exists) setImageUrl(driver.media_url);
      });
    }
  }, [driver?.media_url]);
  return (
    <Box className="flex gap-2 items-center py-3 w-full" width="100%">
      <div>
        {/* <Image src={driver?.media_url} alt="driver" height={24} width={24} /> */}
        {driver?.media_url ? (
          <Image
            src={driver.media_url}
            alt="driver"
            height={24}
            width={24}
            onError={(e) => {
              // Replace the broken image with an Avatar
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.innerHTML = "";
                const avatar = document.createElement("div");
                avatar.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="gray">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
            </svg>`;
                parent.appendChild(avatar);
              }
            }}
          />
        ) : (
          <Avatar size="sm" name={driver?.full_name || "Driver"} />
        )}
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
