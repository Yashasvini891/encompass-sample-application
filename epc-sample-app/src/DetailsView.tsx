import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
// 1. Import the hook from your epc directory
import { useEpc } from "./epc/useEpc";
import "./DetailsView.css";

interface DisplayLoanData {
  borrowerName: string;
  coBorrowerName: string;
  loanNumber: string;
  streetAddress: string;
}

const DetailsView = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const location = useLocation();
  const { originId, partnerAccessToken } =
    (location?.state as { originId?: string; partnerAccessToken?: string }) ||
    {};

  // 2. Consume the useEpc hook right here inside your component
  const { client, loading: epcLoading, error: epcError } = useEpc();

  const [loanData, setLoanData] = useState<DisplayLoanData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State to track the transaction creation execution phase
  const [isCreatingTransaction, setIsCreatingTransaction] =
    useState<boolean>(false);

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

        const response = await window.fetch(
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

        const borrowerName =
          applicationData?.borrower?.fullNameWithSuffix || "N/A";
        const coBorrowerName =
          applicationData?.coborrower?.fullNameWithSuffix || "N/A";
        const loanNumber = originData?.loan?.loanNumber || "N/A";
        const streetAddress =
          applicationData?.borrower?.residences?.[0]?.urla2020StreetAddress ||
          "N/A";

        setLoanData({
          borrowerName,
          coBorrowerName,
          loanNumber,
          streetAddress,
        });
      } catch (err: any) {
        console.error("Error:", err);
        setError(err?.message || "Failed to fetch loan details.");
        setLoanData(null);
      } finally {
        setLoading(false);
      }
    };

    // Only run your custom endpoint query once the origin parameters exist
    if (originId) {
      fetchLoanDetails();
    }
  }, [transactionId, originId, partnerAccessToken]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!loanData) return;
    const { name, value } = e.target;
    setLoanData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  // 3. HANDLER UPDATED TO USE THE CLIENT FROM THE HOOK
  // 3. HANDLER UPDATED TO USE THE CORRECT NESTED LAYOUT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanData || !client) {
      return;
    }

    try {
      setIsCreatingTransaction(true);
      console.log(
        "Sending all 4 fields cleanly nested inside the request object wrapper...",
      );

      // We wrap the payload inside the required 'request' object property
      const newTransactionId = await client.createTransaction({
        request: {
          type: "ZIP Code Validation",
          options: {
            borrowerName: loanData.borrowerName,
            coBorrowerName: loanData.coBorrowerName,
            loanNumber: loanData.loanNumber,
            streetAddress: loanData.streetAddress,
          },
        },
      });

      console.log("Transaction registered successfully! ID:", newTransactionId);
    } catch (err) {
      console.error("Failed to execute createTransaction:", err);
    } finally {
      setIsCreatingTransaction(false);
    }
  };

  // Combine hook loading state with your rest endpoint loading state
  if (loading || epcLoading) {
    return (
      <div className="loan-details-container">
        <h3>Loading Details and connecting to Encompass...</h3>
      </div>
    );
  }

  // Combine hook initialization error blocks with your fetch errors
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
                {/* Row 1 */}
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

                {/* Row 2 */}
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

                {/* Placeholders */}
                <div className="form-group empty-placeholder"></div>
                <div className="form-group empty-placeholder"></div>
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
          </div>
        </form>
      )}
    </div>
  );
};;

export default DetailsView;
