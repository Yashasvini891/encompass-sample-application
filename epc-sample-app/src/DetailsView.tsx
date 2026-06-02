import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
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

  const [loanData, setLoanData] = useState<DisplayLoanData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
          origin_id: originId || transactionId,
          partner_access_token: partnerAccessToken || "",
          access_token: "0006AT4LG62LmgGA1ShFepdLIMOH",
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
          body: JSON.stringify(payload), // ✅ stringify ONLY once here
        },
      );

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const rawData = await response.json();

      const applicationData = rawData?.loan?.applications?.[0];

      const borrowerName =
        applicationData?.borrower?.fullNameWithSuffix || "N/A";

      const coBorrowerName =
        applicationData?.coborrower?.fullNameWithSuffix || "N/A";

      const loanNumber = rawData?.loan?.loanNumber || "N/A";

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

  fetchLoanDetails();
}, [transactionId, originId, partnerAccessToken]);

  if (loading) {
    return (
      <div className="loan-details-container">
        <h3>Loading Details...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loan-details-container">
        <h3 style={{ color: "red" }}>Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="loan-details-container">
      {loanData && (
        <div className="loan-details-card">
          <h3 className="loan-details-title">Loan Summary</h3>
          <div className="loan-details-grid">
            <div className="loan-details-column">
              <div className="loan-details-row">
                <span className="loan-details-label">Borrower Name :</span>
                <span className="loan-details-value">
                  {loanData.borrowerName}
                </span>
              </div>
              <div className="loan-details-row">
                <span className="loan-details-label">Co-Borrower Name :</span>
                <span className="loan-details-value">
                  {loanData.coBorrowerName}
                </span>
              </div>
              <div className="loan-details-row">
                <span className="loan-details-label">Loan Number :</span>
                <span className="loan-details-value">
                  {loanData.loanNumber}
                </span>
              </div>
              <div className="loan-details-row">
                <span className="loan-details-label">
                  Property Street Address :
                </span>
                <span className="loan-details-value">
                  {loanData.streetAddress}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailsView;
