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

  // Holds the exact text from data.message ("Transaction status updated successfully")
  const [apiMessage, setApiMessage] = useState<string | null>(null);

  // Initialized to 'false' so it starts in the OFF state
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
            headers: {
              "Content-Type": "application/json",
            },
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

    if (originId && !transactionId) {
      fetchLoanDetails();
    }
  }, [transactionId, originId, partnerAccessToken]);

  // ---------------- FETCH STATUS ----------------
  const fetchStatus = useCallback(
    async (currentMode: boolean = isSuccessMode) => {
      try {
        setStatusLoading(true);
        setApiMessage(null); // Reset previous message text on click

        const response = await fetch(
          "https://scppchay6k.execute-api.us-west-2.amazonaws.com/testdev/epcStatus",
          {
            method: "POST",
            mode: "cors",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "mock",
              response: currentMode ? "success" : "failed",
              messageName: "epc_transaction_status-R",
            }),
          },
        );

        const data = await response.json();
        let mappedStatus = null;

        // Always grab the exact message sent by the endpoint response body
        if (data.message) {
          setApiMessage(data.message);
        }

        if (data.response === "success") {
          mappedStatus = "COMPLETED";
        } else if (data.response === "failed") {
          mappedStatus = "FAILED";
        }

        setStatus(mappedStatus);
        return mappedStatus;
      } catch (error) {
        console.error("Error fetching status:", error);
        return null;
      } finally {
        setStatusLoading(false);
      }
    },
    [transactionId],
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
          options: {
            borrowerName: "Lisa Smith", 
            coBorrowerName: "John Doe", 
            loanNumber: "123456789",
            streetAddress: "123 Main Street",
          },
        },
      });
      const realTransactionId = newTransactionId;
      console.log("Fetched Transaction ID from UI:", realTransactionId);
      navigate(`/details/${realTransactionId}`);
    } catch (err) {
      console.error("Failed to execute createTransaction:", err);
    } finally {
      setIsCreatingTransaction(false);
    }
  };

  // ---------------- STATUS UI ----------------
  if (transactionId) {
    return (
      <div
        className="loan-details-container"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          alignItems: "flex-start",
        }}
      >
        <button
          type="button"
          onClick={() => client?.closeTransaction()}
          className="submit-btn"
        >
          Close
        </button>
        <h2 style={{ margin: 0 }}>Transaction Status</h2>

        <p style={{ margin: 0 }}>
          <strong>ID:</strong> {transactionId}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontWeight: 500 }}>Mock Status:</span>
          <label
            className="switch"
            style={{ display: "inline-flex", alignItems: "center", margin: 0 }}
          >
            <input
              type="checkbox"
              checked={isSuccessMode}
              onChange={async () => {
                const nextMode = !isSuccessMode;
                setIsSuccessMode(nextMode);
                await fetchStatus(nextMode);
              }}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div
          style={{
            minHeight: "60px",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "4px",
          }}
        >
          {statusLoading ? (
            <CircularProgress size={24} />
          ) : (
            <>
              {status && (
                <h3
                  style={{
                    margin: 0,
                    color: status === "COMPLETED" ? "green" : "red",
                  }}
                >
                  Status: {status}
                </h3>
              )}
              {apiMessage && (
                <p
                  style={{
                    margin: 0,
                    color: "#555555", // Using a clean grey color to smoothly accommodate the message style
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {apiMessage}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ---------------- LOADING ----------------
  if (loading || epcLoading) {
    return (
      <div className="loan-details-container loader-container">
        <CircularProgress />
      </div>
    );
  }
  if (error || epcError) {
    return (
      <div className="loan-details-container">
        <h3 style={{ color: "red" }}>Error</h3>
        <p>{error || epcError}</p>
      </div>
    );
  }

  return (
    <div className="loan-details-container">
      {loanData && (
        <form onSubmit={handleSubmit} className="details-form-wrapper">
          <div className="primary-details-card">
            <div className="card-header">
              <h2>Loan Details</h2>
            </div>

            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className={loanData.borrowerName ? "floating" : ""}>
                    Borrower Name
                  </label>
                  <input
                    type="text"
                    name="borrowerName"
                    value={loanData.borrowerName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className={loanData.coBorrowerName ? "floating" : ""}>
                    Co-Borrower Name
                  </label>
                  <input
                    type="text"
                    name="coBorrowerName"
                    value={loanData.coBorrowerName}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className={loanData.loanNumber ? "floating" : ""}>
                    Loan Reference Number
                  </label>
                  <input
                    type="text"
                    name="loanNumber"
                    value={loanData.loanNumber}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className={loanData.streetAddress ? "floating" : ""}>
                    Property Street Address
                  </label>
                  <input
                    type="text"
                    name="streetAddress"
                    value={loanData.streetAddress}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions-outside">
            <button
              type="submit"
              className="submit-btn"
              disabled={isCreatingTransaction}
            >
              {isCreatingTransaction ? "Creating Transaction..." : "Submit"}
            </button>
            <button
              type="button"
              className="submit-btn" // You can style this cleanly in DetailsView.css
              onClick={() => client?.closeTransaction()}
            >
              Close
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DetailsView;
