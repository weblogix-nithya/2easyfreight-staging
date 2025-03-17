// Icons
import {
  faBriefcase,
  faFileInvoiceDollar,
  faGaugeSimpleHigh,
  faTruckClock,
  faTruckRampBox,
  faUser,
  faUserLock,
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Clients from "pages/admin/clients/index";
import Companies from "pages/admin/companies/index";
import Customers from "pages/admin/customers/index";
import Vendors from "pages/admin/vendors/index";

// Admin Imports
import MainDashboard from "pages/admin/dashboard";
import Drivers from "pages/admin/drivers/index";
import Invoices from "pages/admin/invoices/index";
import JobAllocationIndex from "pages/admin/job-allocations/index";
import Jobs from "pages/admin/jobs/index";
import Profile from "pages/admin/profile";
import Quote from "pages/admin/quotes/index";
import Rctis from "pages/admin/rctis/index";
import Users from "pages/admin/users/index";
import VehicleHire from "pages/admin/vehicle-hires";
// Auth Imports
import { IRoute } from "types/navigation";

const routes: IRoute[] = [
  {
    name: "Dashboard",
    layout: "/admin",
    path: "/dashboard",
    icon: <FontAwesomeIcon icon={faGaugeSimpleHigh} className="mr-1" />,
    // icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
    component: MainDashboard,
    sidebar: true,
    isAdmin: true,
    isCompany: true,
    isPrivate: false,
  },
  {
    name: "Job Allocations",
    title: "Delivery Allocation",
    layout: "/admin",
    path: "/job-allocations",
    icon: <FontAwesomeIcon icon={faTruckRampBox} className="mr-1" />,
    component: JobAllocationIndex,
    sidebar: true,
    isAdmin: true,
    isCompany: false,
    isPrivate: false,
  },
  {
    name: "Delivery Jobs",
    title: "Delivery Jobs",
    layout: "/admin",
    path: "/jobs",
    icon: <FontAwesomeIcon icon={faTruckRampBox} className="mr-1" />,
    component: Jobs,
    sidebar: true,
    isAdmin: true,
    isCompany: true,
    isPrivate: false,
  },
  {
    name: "Hourly Hire",
    title: "Hourly Hire",
    layout: "/admin",
    path: "/vehicle-hires",
    icon: <FontAwesomeIcon icon={faTruckClock} className="mr-1" />,
    component: VehicleHire,
    sidebar: true,
    isAdmin: true,
    isCompany: true,
    isPrivate: false,
  },
  {
    name: "Quotes",
    title: "Quotes",
    layout: "/admin",
    icon: <FontAwesomeIcon icon={faBriefcase} className="mr-1" />,
    path: "/quotes",
    component: Quote,
    sidebar: true,
    isAdmin: true,
    isCompany: true,
  },
  {
    name: "Clients",
    layout: "/admin",
    icon: <FontAwesomeIcon icon={faBriefcase} className="mr-1" />,
    // icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
    path: "/clients",
    component: Clients,
    sidebar: false,
    isAdmin: true,
    isCompany: true,
    isPrivate: false,
  },
  {
    name: "Companies",
    layout: "/admin",
    icon: <FontAwesomeIcon icon={faBriefcase} className="mr-1" />,
    // icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
    path: "/companies",
    component: Companies,
    sidebar: true,
    isAdmin: true,
    isCompany: false,
    isPrivate: true,
  },
  {
    name: "Customers",
    layout: "/admin",
    icon: <FontAwesomeIcon icon={faBriefcase} className="mr-1" />,
    path: "/customers",
    component: Customers,
    sidebar: true,
    isAdmin: true,
    isCompany: true,
    isPrivate: true,
  },
  {
    name: "Invoices",
    layout: "/admin",
    icon: <FontAwesomeIcon icon={faFileInvoiceDollar} className="mr-1" />,
    path: "/invoices",
    component: Invoices,
    sidebar: true,
    isAdmin: true,
    isCompany: true,
    isPrivate: true,
  },
  {
    name: "Driver RCTIs",
    layout: "/admin",
    icon: <FontAwesomeIcon icon={faFileInvoiceDollar} className="mr-1" />,
    path: "/rctis",
    component: Rctis,
    sidebar: true,
    isAdmin: true,
    isCompany: false,
    isPrivate: true,
  },
  {
    name: "Drivers",
    layout: "/admin",
    icon: <FontAwesomeIcon icon={faUser} className="mr-1" />,
    path: "/drivers",
    component: Drivers,
    sidebar: true,
    isAdmin: true,
    isCompany: false,
    isPrivate: false,
  },
  {
    name: "Users",
    layout: "/admin",
    icon: <FontAwesomeIcon icon={faUserLock} className="mr-1" />,
    path: "/users",
    component: Users,
    sidebar: true,
    isAdmin: true,
    isCompany: false,
    isPrivate: false,
  },
  {
    name: "Vendors",
    layout: "/admin",
    icon: <FontAwesomeIcon icon={faBriefcase} className="mr-1" />,
    // icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
    path: "/vendors",
    component: Vendors,
    sidebar: true,
    isAdmin: true,
    isCompany: false,
    isPrivate: true,
  },
  {
    name: "Profile",
    layout: "/admin",
    icon: <FontAwesomeIcon icon={faUserLock} className="mr-1" />,
    path: "/profile",
    component: Profile,
    sidebar: false,
    isAdmin: true,
    isCompany: false,
    isPrivate: false,
  },
];

export default routes;
