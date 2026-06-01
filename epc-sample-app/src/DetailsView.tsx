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

  // 🛠️ FIX 1: Safely read the properties using optional chaining.
  // This prevents the component from crashing if Encompass strips location.state.
  const stateData = location?.state as {
    originId?: string;
    partnerAccessToken?: string;
  } | null;
  const originId = stateData?.originId || "";
  const partnerAccessToken = stateData?.partnerAccessToken || "";

  const [loanData, setLoanData] = useState<DisplayLoanData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 🛠️ FIX 2: Place an un-isolated log straight out in the open component body.
  // This guarantees something will print to the console the millisecond the file mounts.
  console.log("ℹ️ DetailsView file read successfully by the browser engine!", {
    urlParamId: transactionId,
    stateOriginId: originId,
    hasToken: !!partnerAccessToken,
  });

  useEffect(() => {
    console.log("🟢 useEffect has successfully fired inside the iframe!");

    const fetchLoanDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fallback target initialization
        const targetOriginId = originId || transactionId || "";

        const payload = {
          messageName: "GET_ORIGIN",
          origin_id: targetOriginId,
          partner_access_token: partnerAccessToken,
        };

        console.log("📦 Dispatched Body Payload Configuration:", payload);

        // Explicit absolute endpoint execution bypassing global env caches
        const response = await window.fetch(
          `https://scppchay6k.execute-api.us-west-2.amazonaws.com/testdev/origin`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // ❌ Authorization header removed per your Team Lead's explicit feedback
            },
            body: JSON.stringify(payload),
          },
        );

        console.log("📥 ACTUAL URL RESPONDED:", response.url);
        console.log("🚦 RESPONSE STATUS CODE:", response.status);

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
        console.error("❌ Fetch execution block failure:", err);
        setError(err?.message || "Failed to fetch loan details.");
        setLoanData(null);
      } finally {
        setLoading(false);
      }
    };

    if (transactionId || originId) {
      fetchLoanDetails();
    } else {
      console.warn(
        "⚠️ Core execution aborted: Missing context tracking identifiers.",
      );
      setLoading(false);
    }
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
