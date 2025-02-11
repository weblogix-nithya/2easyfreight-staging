import { useToast } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/store";

export interface Marker {
  lng: number;
  lat: number;
  icon?: string;
  data?: any;
}

// add in drivers locations, pick up locations, drop off locations etc
export function TrackingMap({
  center,
  zoom,
  markers,
  drivers,
  onCenterChanged,
  onZoomChanged,
  isRouting = false,
}: {
  center: google.maps.LatLng;
  zoom: number;
  markers?: Marker[];
  drivers?: Marker[];
  onCenterChanged: any;
  onZoomChanged: any;
  isRouting?: boolean;
}) {
  const toast = useToast();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const driversRef = useRef([]);

  const rightSideBarJob = useSelector(
    (state: RootState) => state.rightSideBar.job,
  );
  const rightSideBarRoute = useSelector(
    (state: RootState) => state.rightSideBar.route,
  );

  useEffect(() => {
    if (window.google && window.google.maps) {
      if (mapRef.current && !mapInstance.current) {
        // Initialize the map
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center: center,
          zoom: zoom,
        });

        mapInstance.current.addListener("zoom_changed", () => {
          onZoomChanged(mapInstance.current.getZoom());
        });

        mapInstance.current.addListener("center_changed", () => {
          onCenterChanged({
            lat: mapInstance.current.getCenter().lat(),
            lng: mapInstance.current.getCenter().lng(),
          });
        });
      }
      console.log("Init Map");
    } else {
      console.error("Google Maps API is not loaded.");
    }
  }, []);

  useEffect(() => {
    if (!window.google || !window.google.maps) {
      console.error("Google Maps API is not loaded.");
      return;
    }
    console.log(driversRef.current);
    console.log(drivers);
    // Clear existing driver markers
    driversRef.current.forEach((driver) => driver.setMap(null));
    driversRef.current = [];

    drivers?.forEach((driver, index) => {
      if (driver.lng && driver.lat) {
        let driverMarker = new window.google.maps.Marker({
          position: { lat: driver.lat, lng: driver.lng },
          map: mapInstance.current,
          icon: {
            url: driver.icon,
            size: new google.maps.Size(71, 71),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(17, 34),
            scaledSize: new google.maps.Size(25, 25),
          },
          // @ts-ignore
          data: driver.data || null,
          zIndex: 1000,
        });

        driversRef.current.push(driverMarker);
      }
    });
  }, [drivers]);

  useEffect(() => {
    if (!window.google || !window.google.maps) {
      console.error("Google Maps API is not loaded.");
      return;
    }

    // Clear existing driver markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const waypoints: google.maps.DirectionsWaypoint[] = [];
    markers?.forEach((marker, index) => {
      let googleMarker = new window.google.maps.Marker({
        position: { lat: marker.lat, lng: marker.lng },
        map: mapInstance.current,
        icon: {
          url: marker.icon,
          size: new google.maps.Size(71, 71),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(27, 44),
          scaledSize: new google.maps.Size(50, 50),
        },
        // @ts-ignore
        data: marker.data || null,
        zIndex: 1000,
      });

      markersRef.current.push(googleMarker);

      if (index > 0 && index < markers.length - 1) {
        waypoints.push({
          location: {
            lng: googleMarker.getPosition().lng(),
            lat: googleMarker.getPosition().lat(),
          },
          stopover: true,
        });
      }
    });

    const directionsService = new google.maps.DirectionsService();
    const directionsDisplay = new google.maps.DirectionsRenderer({
      map: mapInstance.current,
      suppressMarkers: true,
      suppressInfoWindows: true,
    });

    const googleMarkers = markersRef.current;
    // 23 waypoints max
    if (
      waypoints.length < 23 &&
      googleMarkers.length > 1 &&
      (isRouting || rightSideBarJob != null || rightSideBarRoute != null)
    ) {
      directionsService.route(
        {
          origin: {
            lat: googleMarkers[0].getPosition().lat(),
            lng: googleMarkers[0].getPosition().lng(),
          },
          destination: {
            lat: googleMarkers[googleMarkers.length - 1].getPosition().lat(),
            lng: googleMarkers[googleMarkers.length - 1].getPosition().lng(),
          },
          avoidTolls: true,
          avoidHighways: false,
          waypoints: waypoints,
          optimizeWaypoints: true,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        function (response, status) {
          if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
          } else {
            toast({
              title: "No route or jobs found",
              status: "error",
              duration: 3000,
              isClosable: true,
            });
          }
        },
      );
    }
  }, [markers]);

  // useEffect(() => {
  //   const map = new window.google.maps.Map(mapRef.current, {
  //     center: center,
  //     zoom: zoom,
  //   });

  //   var driverMarkers: google.maps.Marker[] = [];
  //   var googleMarkers: google.maps.Marker[] = [];
  //   const waypoints: google.maps.DirectionsWaypoint[] = [];

  //   const directionsService = new google.maps.DirectionsService();
  //   const directionsDisplay = new google.maps.DirectionsRenderer({
  //     map: map,
  //     suppressMarkers: true,
  //     suppressInfoWindows: true,
  //   });

  //   var bounds = new google.maps.LatLngBounds();

  //   map.addListener("zoom_changed", () => {
  //     onZoomChanged(map.getZoom());
  //   });

  //   map.addListener("center_changed", () => {
  //     onCenterChanged({
  //       lat: map.getCenter().lat(),
  //       lng: map.getCenter().lng(),
  //     });
  //   });

  //   markers?.forEach((marker, index) => {
  //     let googleMarker = new window.google.maps.Marker({
  //       position: { lat: marker.lat, lng: marker.lng },
  //       map,
  //       icon: {
  //         url: marker.icon,
  //         size: new google.maps.Size(71, 71),
  //         origin: new google.maps.Point(0, 0),
  //         anchor: new google.maps.Point(27, 44),
  //         scaledSize: new google.maps.Size(50, 50),
  //       },
  //       // @ts-ignore
  //       data: marker.data || null,
  //       zIndex: 1000,
  //     });

  //     googleMarkers.push(googleMarker);
  //     if (index > 0 && index < markers.length - 1) {
  //       waypoints.push({
  //         location: {
  //           lng: googleMarker.getPosition().lng(),
  //           lat: googleMarker.getPosition().lat(),
  //         },
  //         stopover: true,
  //       });
  //     }

  //     // bounds.extend(googleMarker.getPosition());

  //     googleMarker.addListener("click", () => {
  //       // @ts-ignore
  //       onMarkerClick(googleMarker.data);
  //     });
  //   });

  //   drivers?.forEach((driver, index) => {
  //     if (driver.lng && driver.lat) {
  //       let driverMarker = new window.google.maps.Marker({
  //         position: { lat: driver.lat, lng: driver.lng },
  //         map,
  //         icon: {
  //           url: driver.icon,
  //           size: new google.maps.Size(71, 71),
  //           origin: new google.maps.Point(0, 0),
  //           anchor: new google.maps.Point(17, 34),
  //           scaledSize: new google.maps.Size(25, 25),
  //         },
  //         // @ts-ignore
  //         data: driver.data || null,
  //         zIndex: 1000,
  //       });

  //       driverMarkers.push(driverMarker);
  //       // bounds.extend(driverMarker.getPosition());

  //       driverMarker.addListener("click", () => {
  //         // @ts-ignore
  //         onDriverClick(driverMarker.data);
  //       });
  //     }
  //   });

  //   // 23 waypoints max
  //   if (
  //     waypoints.length < 23 &&
  //     googleMarkers.length > 1 &&
  //     (rightSideBarJob != null || rightSideBarRoute != null)
  //   ) {
  //     directionsService.route(
  //       {
  //         origin: {
  //           lat: googleMarkers[0].getPosition().lat(),
  //           lng: googleMarkers[0].getPosition().lng(),
  //         },
  //         destination: {
  //           lat: googleMarkers[googleMarkers.length - 1].getPosition().lat(),
  //           lng: googleMarkers[googleMarkers.length - 1].getPosition().lng(),
  //         },
  //         avoidTolls: true,
  //         avoidHighways: false,
  //         waypoints: waypoints,
  //         optimizeWaypoints: true,
  //         travelMode: google.maps.TravelMode.DRIVING,
  //       },
  //       function (response, status) {
  //         if (status == google.maps.DirectionsStatus.OK) {
  //           directionsDisplay.setDirections(response);
  //         } else {
  //           toast({
  //             title: "No route or jobs found",
  //             status: "error",
  //             duration: 3000,
  //             isClosable: true,
  //           });
  //         }
  //       },
  //     );
  //   }
  // });

  return <div ref={mapRef} id="map" style={{ height: "100%" }} />;
}
