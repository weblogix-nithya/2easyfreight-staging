import { useMutation } from "@apollo/client";
import {
  Box,
  Button,
  Divider,
  Flex,
  Link,
  // useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { showGraphQLErrorToast } from "components/toast/ToastError";
import { UPDATE_REPORT_ISSUE_MUTATION } from "graphql/issueReport";
import { formatDate } from "helpers/helper";
import React, { useEffect, useMemo, useState } from "react";

import PaginationMultipleImageTable from "./PaginationMultipleImageTable";

export default function ReportsTab(props: { jobObject: any }) {
  const { jobObject } = props;
  const toast = useToast();
  const [job, setJob] = useState(jobObject);
  const [jobDestinationsConfirmed, setJobDestinationsConfirmed] = useState([]);
  const [driverIssues, setDriverIssues] = useState([]);
  const [customerIssues, setCustomerIssues] = useState([]);

  const pickupColumns = useMemo(
    () => [
      {
        Header: "TYPE",
        accessor: "type" as const,
      },
      {
        Header: "ADDRESS",
        accessor: "address" as const,
      },
      {
        Header: "DATE",
        accessor: "date_pick_up" as const,
      },
      {
        Header: "HANDOVER PERSON",
        accessor: "pick_up_name" as const,
      },
      {
        Header: "CONDITION REPORT",
        accessor: "pick_up_condition" as const,
      },
      {
        Header: "PHOTO EVIDENCE",
        accessor: "media" as const,
        isMultipleImage: true,
      },
      {
        Header: "Handout Signature",
        accessor: "signature" as const,
        isMultipleImage: true,
      },
    ],
    [],
  );
  const issuesColumns = useMemo(
    () => [
      {
        Header: "SUBMITED BY",
        accessor: "uploaded_by" as const,
      },
      {
        Header: "DATE",
        accessor: "date" as const,
      },
      {
        Header: "TYPE",
        accessor: "type" as const,
      },
      {
        Header: "DESCRIPTION",
        accessor: "name" as const,
      },
      {
        Header: "STATUS",
        accessor: "status" as const,
      },
      {
        Header: "Actions",
        accessor: "issue_report_status_id" as const,
        changeStatus: true,
        isLinkAction: true,
      },
    ],
    [],
  );

  // const handleDownloadPod = () => {
  //   console.log("download pod"); //TODO: download pod
  // };
  useEffect(() => {
    setJob(jobObject);
    let _driverIssues: any[] = [];
    let _customerIssues: any[] = [];
    let _jobDestinationsConfirmed = jobObject.job_destinations.filter(
      (jobDestination: any) => jobDestination.job_destination_status_id === 3,
    );
    // change is_pickup to pickup or delivery
    _jobDestinationsConfirmed = _jobDestinationsConfirmed.map(
      (jobDestination: any) => {
        if (jobDestination.is_pickup) {
          jobDestination = { ...jobDestination, type: "Pickup" };
        } else {
          jobDestination = { ...jobDestination, type: "Delivery" };
        }

        jobDestination = {
          ...jobDestination,
          date_pick_up: formatDate(
            jobDestination.updated_at,
            "HH:MM, DD/MM/YYYY",
          ),
        };
        if (jobDestination.issue_reports.length > 0) {
          jobDestination.issue_reports.map((issueReport: any) => {
            // if sourceable_type = App\\Models\\Driver
            let _issue = {
              ...issueReport,
              date: formatDate(issueReport.updated_at, "HH:MM, DD/MM/YYYY"),
              type: issueReport.issue_report_type?.name,
              status: issueReport.issue_report_status?.name,
              uploaded_by: issueReport.sourceable?.full_name,
            };
            if (issueReport.sourceable?.__typename === "Driver") {
              _driverIssues.push(_issue);
            } else if (issueReport.sourceable?.__typename === "Customer") {
              _customerIssues.push(_issue);
            }
          });

          //_driverIssues = _driverIssues.concat(jobDestination.issue_reports);
        }
        return jobDestination;
      },
    );
    _jobDestinationsConfirmed = _jobDestinationsConfirmed.map(
      (destination: any) => {
        // Filter media array for items with collection_name equal to "signatures"
        const signatureMedia = destination.media.filter(
          (item: any) => item.collection_name === "signatures",
        );

        const normalMedia = destination.media.filter(
          (item: any) => item.collection_name !== "signatures",
        );

        // Assign the handoutSignatures array to the handout_signature property of the destination object
        return {
          ...destination,
          signature: signatureMedia,
          media: normalMedia,
        };
      },
    );

    setJobDestinationsConfirmed(_jobDestinationsConfirmed);
    setDriverIssues(_driverIssues);
    setCustomerIssues(_customerIssues);
  }, [jobObject]);
  //handleChangeIssueStatus
  const [handleChangeIssueStatus, {}] = useMutation(
    UPDATE_REPORT_ISSUE_MUTATION,
    {
      onCompleted: (data) => {
        // set new status to previous object
        let _issueReport = data.updateIssueReport;
        if (_issueReport.sourceable.__typename === "Driver") {
          setDriverIssues([]);
          let _driverIssues = driverIssues.map((issue: any) => {
            if (issue.id === _issueReport.id) {
              issue = {
                ...issue,
                status: _issueReport.issue_report_status?.name,
                issue_report_status_id: _issueReport.issue_report_status_id,
              };
            }
            return issue;
          });
          setDriverIssues(_driverIssues);
        } else if (_issueReport.sourceable.__typename === "Customer") {
          let _customerIssues = customerIssues.map((issue: any) => {
            if (issue.id === _issueReport.id) {
              issue = {
                ...issue,
                status: _issueReport.issue_report_status?.name,
                issue_report_status_id: _issueReport.issue_report_status_id,
              };
            }
            return issue;
          });
          setCustomerIssues(_customerIssues);
        }
        toast({
          title: "Issue updated",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      },
      onError: (error) => {
        showGraphQLErrorToast(error);
      },
    },
  );
  return (
    <Box className="mt-6">
      {/* Reports */}
      <Box>
        <Flex justify="space-between" align="center" className="mb-7">
          <h3 className="">Pickup & Delivery Confirmation</h3>
          {job.pod_url != null && (
            <Button variant="secondary">
              <Link href={job.pod_url} isExternal>
                Download POD
              </Link>
            </Button>
          )}
        </Flex>

        {true && (
          <PaginationMultipleImageTable
            columns={pickupColumns}
            data={jobDestinationsConfirmed}
          />
        )}
      </Box>

      <Divider className="my-12" />

      {/* Driver Issues */}
      <Box>
        <Flex justify="space-between" align="center">
          <h3>Driver Issues</h3>
        </Flex>

        {true && (
          <PaginationMultipleImageTable
            columns={issuesColumns}
            data={driverIssues}
            onLinkEvent={(id, status) => {
              handleChangeIssueStatus({
                variables: {
                  input: {
                    id,
                    issue_report_status_id: status == 1 ? 2 : 1,
                  },
                },
              });
            }}
          />
        )}
      </Box>

      <Divider className="my-12" />

      {/* Customer Issues */}
      <Box>
        <Flex justify="space-between" align="center">
          <h3>Customer Issues</h3>
        </Flex>

        {true && (
          <PaginationMultipleImageTable
            columns={issuesColumns}
            data={customerIssues}
            onLinkEvent={(id, status) => {
              handleChangeIssueStatus({
                variables: {
                  input: {
                    id,
                    issue_report_status_id: status == 1 ? 2 : 1,
                  },
                },
              });
            }}
          />
        )}
      </Box>
    </Box>
  );
}
