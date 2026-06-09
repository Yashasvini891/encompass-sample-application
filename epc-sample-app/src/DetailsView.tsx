import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useEpc } from "./epc/useEpc";
import "./DetailsView.css";
import CircularProgress from "@mui/material/CircularProgress";

interface DisplayLoanData {
  borrowerName: string;
  coBorrowerName: string;
  loanNumber: string;
  streetAddress: string;
}

const DetailsView = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const { originId, partnerAccessToken } =
    (location?.state as { originId?: string; partnerAccessToken?: string }) ||
    {};

  const { client, loading: epcLoading, error: epcError } = useEpc();

  const [loanData, setLoanData] = useState<DisplayLoanData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingTransaction, setIsCreatingTransaction] =
    useState<boolean>(false);

  const [status, setStatus] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [isSuccessMode, setIsSuccessMode] = useState<boolean>(false);

  // ---------------- FETCH LOAN DETAILS ----------------
  useEffect(() => {
    const fetchLoanDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const payload = {
          headers: {
            "cognito-id": "not required",
            message_name: "epc_origin-R",
          },
          body: {
            messageName: "epc_origin-R",
            origin_id: originId,
            partner_access_token: partnerAccessToken || "",
          },
        };

        const response = await fetch(
          "https://scppchay6k.execute-api.us-west-2.amazonaws.com/testdev/origin",
          {
            method: "POST",
            mode: "cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );

        if (!response.ok) {
          throw new Error(`Server returned status: ${response.status}`);
        }

        const rawData = await response.json();
        const originData = rawData?.origin_response;
        const applicationData = originData?.loan?.applications?.[0];

        setLoanData({
          borrowerName: applicationData?.borrower?.fullNameWithSuffix || "N/A",
          coBorrowerName:
            applicationData?.coborrower?.fullNameWithSuffix || "N/A",
          loanNumber: originData?.loan?.loanNumber || "N/A",
          streetAddress:
            applicationData?.borrower?.residences?.[0]?.urla2020StreetAddress ||
            "N/A",
        });
      } catch (err: unknown) {
        console.error("Error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch loan details.",
        );
        setLoanData(null);
      } finally {
        setLoading(false);
      }
    };

    if (originId) {
      fetchLoanDetails();
    }
  }, [originId, partnerAccessToken]);

  // ---------------- FETCH STATUS ----------------
  const fetchStatus = useCallback(
    async (currentMode: boolean = isSuccessMode) => {
      try {
        setStatusLoading(true);
        setApiMessage(null);

        const response = await fetch(
          "https://scppchay6k.execute-api.us-west-2.amazonaws.com/testdev/epcStatus",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "mock",
              response: currentMode ? "success" : "failed",
              messageName: "epc_transaction_status-R",
            }),
          },
        );

        const data = await response.json();

        if (data.message) {
          setApiMessage(data.message);
        }

        const mappedStatus =
          data.response === "success"
            ? "COMPLETED"
            : data.response === "failed"
              ? "FAILED"
              : null;

        setStatus(mappedStatus);
      } catch (error) {
        console.error("Error fetching status:", error);
      } finally {
        setStatusLoading(false);
      }
    },
    [isSuccessMode],
  );

  // ---------------- INPUT CHANGE ----------------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!loanData) return;
    const { name, value } = e.target;
    setLoanData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanData || !client) return;

    try {
      setIsCreatingTransaction(true);

      const newTransactionId = await client.createTransaction({
        request: {
          type: "Submit Tax Wallet",
          options: loanData,
        },
      });

      const realTransactionId =
        typeof newTransactionId === "string"
          ? newTransactionId
          : (newTransactionId as { id: string }).id;

      // Call webhook
      await fetch(
        "https://scppchay6k.execute-api.us-west-2.amazonaws.com/testdev/demo-webhook",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionId: realTransactionId,
            messageName: "epc_transaction-R",
          }),
        },
      );
      navigate(`/details/${realTransactionId}`, {
        state: { originId, partnerAccessToken },
      });
    } catch (err) {
      console.error("Failed to create transaction:", err);
    } finally {
      setIsCreatingTransaction(false);
    }
  };

  // ---------------- GLOBAL LOADER ----------------
  if (loading || epcLoading || isCreatingTransaction) {
    return (
      <div className="loader-container">
        <CircularProgress />
      </div>
    );
  }

  // ---------------- ERROR ----------------
  if (error || epcError) {
    return (
      <div className="loan-details-container">
        <h3 style={{ color: "red" }}>Error</h3>
        <p>{error || epcError}</p>
      </div>
    );
  }

  // ---------------- TRANSACTION VIEW ----------------
  if (transactionId) {
    return (
      <div className="loan-details-container">
        <button
          onClick={() => client?.closeTransaction()}
          className="submit-btn"
        >
          Close
        </button>

        <h2>Transaction Status</h2>
        <p>
          <strong>ID:</strong> {transactionId}
        </p>

        {/*  Loan Details Added */}
        {loanData && (
          <div className="details-card">
            <p>
              <strong>Borrower:</strong> {loanData.borrowerName}
            </p>
            <p>
              <strong>Co-Borrower:</strong> {loanData.coBorrowerName}
            </p>
            <p>
              <strong>Loan Number:</strong> {loanData.loanNumber}
            </p>
            <p>
              <strong>Address:</strong> {loanData.streetAddress}
            </p>
          </div>
        )}

        {/* Status Toggle */}
        <label className="switch">
          <input
            type="checkbox"
            checked={isSuccessMode}
            onChange={async () => {
              const next = !isSuccessMode;
              setIsSuccessMode(next);
              await fetchStatus(next);
            }}
          />
          <span className="slider"></span>
        </label>

        {/* Status */}
        {statusLoading ? (
          <CircularProgress size={24} />
        ) : (
          <>
            {status && (
              <h3 style={{ color: status === "COMPLETED" ? "green" : "red" }}>
                Status: {status}
              </h3>
            )}
            {apiMessage && <p>{apiMessage}</p>}
          </>
        )}
      </div>
    );
  }

  // ---------------- FORM VIEW ----------------
  return (
    <div className="loan-details-container">
      {loanData && (
        <form onSubmit={handleSubmit}>
          <input
            name="borrowerName"
            value={loanData.borrowerName}
            onChange={handleInputChange}
          />
          <input
            name="coBorrowerName"
            value={loanData.coBorrowerName}
            onChange={handleInputChange}
          />
          <input
            name="loanNumber"
            value={loanData.loanNumber}
            onChange={handleInputChange}
          />
          <input
            name="streetAddress"
            value={loanData.streetAddress}
            onChange={handleInputChange}
          />

          <button type="submit" disabled={isCreatingTransaction}>
            Submit
          </button>
        </form>
      )}
    </div>
  );
};

export default DetailsView;
