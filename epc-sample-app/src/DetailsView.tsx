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

    fetchLoanDetails();
  }, [transactionId, originId, partnerAccessToken]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!loanData) return;
    const { name, value } = e.target;
    setLoanData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted Loan Data:", loanData);
  };

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
        /* The form wrapper now surrounds both the card and the outside action row */
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

          {/* Form Actions are now OUTSIDE the white card layout */}
          <div className="form-actions-outside">
            <button type="submit" className="submit-btn">
              Submit
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DetailsView;
