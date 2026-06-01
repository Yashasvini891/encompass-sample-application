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

  // 1️⃣ CHANGE: Added safe optional chaining (?.) and an empty fallback object (|| {})
  // This prevents the code from completely freezing if a user refreshes or navigates here directly.
  const { originId, partnerAccessToken } =
    (location?.state as { originId?: string; partnerAccessToken?: string }) ||
    {};

  const [loanData, setLoanData] = useState<DisplayLoanData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 2️⃣ CHANGE: Moved the log to the ABSOLUTE FIRST LINE of the hook.
    // This proves the component successfully mounted and React executed the lifecycle.
    console.log("🟢 useEffect successfully triggered!", {
      transactionId,
      originId,
      hasToken: !!partnerAccessToken,
    });

    const fetchLoanDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const payload = {
          messageName: "GET_ORIGIN",
          origin_id: originId || transactionId,
          partner_access_token: partnerAccessToken || "",
        };

        console.log("📦 Dispatching Payload to AWS API Gateway:", payload);

        const response = await window.fetch(
          `https://scppchay6k.execute-api.us-west-2.amazonaws.com/testdev/origin`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // ❌ Header stripped per Team Lead's instructions. Token is strictly body payload.
            },
            body: JSON.stringify(payload),
          },
        );

        console.log("📥 ACTUAL URL RESPONDED:", response.url);
        console.log("🚦 RESPONSE STATUS:", response.status);

        if (!response.ok) {
          throw new Error(`Server returned status: ${response.status}`);
        }

        const rawData = await response.json();

        let parsedOrigin: any = {};
        try {
          if (rawData.origin) {
            parsedOrigin = JSON.parse(rawData.origin.trim());
          }
        } catch (e) {
          console.warn("⚠️ Origin parse failed:", e);
        }

        const firstRequestItem = rawData.originResponse?.[0]?.requests?.[0];
        const applicationData = parsedOrigin?.loan?.applications?.[0];

        const borrowerName = firstRequestItem
          ? `${firstRequestItem.firstName} ${firstRequestItem.lastName}`
          : applicationData?.borrower?.fullNameWithSuffix || "N/A";

        const coBorrowerName =
          applicationData?.coborrower?.fullNameWithSuffix || "N/A";
        const loanNumber = rawData.loanNumber || "N/A";
        const streetAddress =
          firstRequestItem?.addressLine1 ||
          applicationData?.borrower?.residences?.[0]?.urla2020StreetAddress ||
          "N/A";

        setLoanData({
          borrowerName,
          coBorrowerName,
          loanNumber,
          streetAddress,
        });
      } catch (err: any) {
        console.error("❌ Catch Block Intercepted Error:", err);
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
