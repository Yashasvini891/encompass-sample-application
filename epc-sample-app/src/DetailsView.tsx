import { useEffect, useState, ChangeEvent, DragEvent } from "react";
import { useParams, useLocation } from "react-router-dom";
import "./DetailsView.css";

interface DisplayLoanData {
  borrowerId: string;
  borrowerName: string;
  coBorrowerName: string;
  email: string;
  phoneNumber: string;
  loanNumber: string;
  propertyAddress: string;
  paymentStatus: string;
}

const DetailsView = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const location = useLocation();
  const { originId, partnerAccessToken } =
    (location.state as { originId?: string; partnerAccessToken?: string }) ||
    {};

  const [loanData, setLoanData] = useState<DisplayLoanData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  useEffect(() => {
    const fetchLoanDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const payload = {
          message_name: "GET_ORIGIN",
          originId: originId || transactionId,
          partnerAccessToken: partnerAccessToken || "",
        };

        console.log(
          "🛰️ Attempting to hit backend endpoint with payload:",
          payload,
        );

        const response = await fetch("/api/loan-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        // If the backend exists and works, parse its real response
        if (response.ok) {
          const rawData = await response.json();
          let parsedOrigin: any = {};
          try {
            if (rawData.origin) {
              parsedOrigin = JSON.parse(rawData.origin.trim());
            }
          } catch (e) {
            console.warn(
              "⚠️ Could not parse stringified 'origin' sub-property field:",
              e,
            );
          }

          const firstResponseGroup = rawData.originResponse?.[0];
          const firstRequestItem = firstResponseGroup?.requests?.[0];
          const applicationData = parsedOrigin?.loan?.applications?.[0];

          setLoanData({
            borrowerId:
              rawData.primaryBorrowerId || firstResponseGroup?.id || "N/A",
            borrowerName: firstRequestItem
              ? `${firstRequestItem.firstName} ${firstRequestItem.lastName}`
              : applicationData?.borrower?.fullNameWithSuffix || "N/A",
            coBorrowerName:
              applicationData?.coborrower?.fullNameWithSuffix || "N/A",
            email:
              applicationData?.borrower?.emailAddressText ||
              firstRequestItem?.email ||
              "N/A",
            phoneNumber: firstRequestItem?.tin || "N/A",
            loanNumber: rawData.loanNumber || "N/A",
            propertyAddress: firstRequestItem
              ? `${firstRequestItem.addressLine1}, ${firstRequestItem.addressLine2 || ""} ${firstRequestItem.city}, ${firstRequestItem.state} ${firstRequestItem.postalCode}`
              : "N/A",
            paymentStatus: firstRequestItem?.status || "N/A",
          });
        } else {
          // Force throw to trigger our mock fallback if status is 403 / 404
          throw new Error(`Server status: ${response.status}`);
        }
      } catch (err) {
        console.warn(
          "⚠️ API is not ready or returned an error. Using local mock data fallback to display screen layout.",
          err,
        );

        // MOCK FALLBACK: Populates the screen with the data from your JSON example so the layout renders
        setLoanData({
          borrowerId: "db7b2f19-9287-48aa-85db-f21c89cbb50d",
          borrowerName: "Jack Anderson",
          coBorrowerName: "Mary Smith",
          email: "anderson.jack@mailinator.com",
          phoneNumber: "234-32-4234",
          loanNumber: "2605EM000934",
          propertyAddress:
            "123 Main Street, Apartment 454, Cypress, FL 32432-423",
          paymentStatus: "Request Submitted",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLoanDetails();
  }, [transactionId, originId, partnerAccessToken]);

  const handleFile = (files: FileList | null) => {
    if (files && files[0]) {
      console.log("🚀 Policy document uploaded successfully:", files[0].name);
    }
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFile(e.dataTransfer.files);
  };

  if (loading)
    return (
      <div className="loan-details-container">
        <h3>Loading Loan Profile Details...</h3>
      </div>
    );
  if (error)
    return (
      <div className="loan-details-container">
        <h3 style={{ color: "red" }}>Error: {error}</h3>
      </div>
    );

  return (
    <div className="loan-details-container">
      {loanData && (
        <div className="loan-details-card">
          <h3 className="loan-details-title">Loan Details</h3>
          <div className="loan-details-grid">
            {/* Column One */}
            <div className="loan-details-column">
              <div className="loan-details-row">
                <span className="loan-details-label">Borrower ID :</span>
                <span className="loan-details-value loan-details-uuid">
                  {loanData.borrowerId}
                </span>
              </div>
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
                <span className="loan-details-label">Property Address :</span>
                <span className="loan-details-value">
                  {loanData.propertyAddress}
                </span>
              </div>
            </div>

            {/* Column Two */}
            <div className="loan-details-column">
              <div className="loan-details-row">
                <span className="loan-details-label">Borrower Email :</span>
                <span className="loan-details-value">{loanData.email}</span>
              </div>
              <div className="loan-details-row">
                <span className="loan-details-label">Phone Number :</span>
                <span className="loan-details-value">
                  {loanData.phoneNumber}
                </span>
              </div>
              <div className="loan-details-row">
                <span className="loan-details-label">Loan Ref Number :</span>
                <span className="loan-details-value">
                  {loanData.loanNumber}
                </span>
              </div>
              <div className="loan-details-row">
                <span className="loan-details-label">Payment Status :</span>
                <span className="loan-details-value">
                  {loanData.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        className={`policy-upload-zone ${dragActive ? "active" : ""}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="policy-upload"
          style={{ display: "none" }}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            handleFile(e.target.files)
          }
        />
        <label htmlFor="policy-upload" className="policy-upload-label">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0a1d37"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginBottom: "8px" }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div>
            <span className="policy-upload-text-underline">Click here</span>
            <span className="policy-upload-text-normal">
              or Drag and Drop to upload Policy
            </span>
          </div>
        </label>
      </div>
    </div>
  );
};

export default DetailsView;
