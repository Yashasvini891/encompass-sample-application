import { useEffect, useState } from "react";
import type { ChangeEvent, DragEvent } from "react"; // Explicit type imports to support verbatimModuleSyntax configurations
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

interface UploadedFileTracker {
  name: string;
  status: "Uploading..." | "Success";
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
  const [uploadedFile, setUploadedFile] = useState<UploadedFileTracker | null>(
    null,
  );

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

        const response = await fetch("/origin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Server returned status: ${response.status}`);
        }

        const rawData = await response.json();
        console.log("📥 Raw JSON Payload Data Received:", rawData);

        // 1. Safely parse the stringified 'origin' sub-block to use for Co-Borrower and Email fallbacks
        let parsedOrigin: any = {};
        try {
          if (rawData.origin) {
            const cleanJsonString = rawData.origin.trim();
            parsedOrigin = JSON.parse(cleanJsonString);
          }
        } catch (e) {
          console.warn(
            "⚠️ Could not parse stringified 'origin' sub-property field:",
            e,
          );
        }

        // 2. Set pointers directly to your core originResponse -> requests layers
        const firstResponseGroup = rawData.originResponse?.[0];
        const firstRequestItem = firstResponseGroup?.requests?.[0];
        const applicationData = parsedOrigin?.loan?.applications?.[0];

        // 3. PRIORITY MAPPING: Pull metrics out of originResponse elements
        const extractedBorrowerName = firstRequestItem
          ? `${firstRequestItem.firstName} ${firstRequestItem.lastName}`
          : applicationData?.borrower?.fullNameWithSuffix || "N/A";

        const extractedCoBorrowerName =
          applicationData?.coborrower?.fullNameWithSuffix || "N/A";

        // Pull array email parameter; fallback to string metadata block if array index value reads null
        const extractedEmail =
          firstRequestItem && firstRequestItem.email
            ? firstRequestItem.email
            : applicationData?.borrower?.emailAddressText || "N/A";

        // Build composite property address using your exact array data variables
        let extractedAddress = "N/A";
        if (firstRequestItem) {
          const parts = [
            firstRequestItem.addressLine1,
            firstRequestItem.addressLine2,
            firstRequestItem.city,
            firstRequestItem.state,
            firstRequestItem.postalCode,
          ].filter(Boolean); // Cleans out missing parameters gracefully

          if (parts.length > 0) {
            extractedAddress = parts.join(", ");
          }
        } else if (applicationData?.borrower?.residences?.[0]) {
          const res = applicationData.borrower.residences[0];
          extractedAddress = `${res.urla2020StreetAddress}, ${res.addressCity}, ${res.addressState} ${res.addressPostalCode}`;
        }

        // 4. Update the layout dataset tracking model
        setLoanData({
          borrowerId:
            firstResponseGroup?.id || rawData.primaryBorrowerId || "N/A",
          borrowerName: extractedBorrowerName,
          coBorrowerName: extractedCoBorrowerName,
          email: extractedEmail,
          phoneNumber: firstRequestItem?.tin || "N/A",
          loanNumber: rawData.loanNumber || "N/A",
          propertyAddress: extractedAddress,
          paymentStatus: firstRequestItem?.status || "N/A",
        });
      } catch (err: any) {
        console.error(
          "❌ Error running live data payload extraction parsing:",
          err,
        );
        setError(
          err?.message || "Failed to parse active loan metadata matrix.",
        );
        setLoanData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLoanDetails();
  }, [transactionId, originId, partnerAccessToken]);

  const handleFile = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];

      setUploadedFile({
        name: file.name,
        status: "Uploading...",
      });

      setTimeout(() => {
        setUploadedFile({
          name: file.name,
          status: "Success",
        });
        alert(
          `🎉 Success!\n\nFile "${file.name}" has been uploaded and processed successfully inside your local workspace.`,
        );
      }, 10000);
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
        <h3 style={{ color: "red" }}>Backend Server Mapping Error</h3>
        <p style={{ color: "#555" }}>{error}</p>
        <p style={{ fontSize: "12px", color: "#888" }}>
          Please confirm your api endpoint handler route is listening for
          requests.
        </p>
      </div>
    );

  return (
    <div className="loan-details-container">
      {loanData && (
        <div className="loan-details-card">
          <h3 className="loan-details-title">Loan Details</h3>
          <div className="loan-details-grid">
            {/* Column One: Personal Profiles */}
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

            {/* Column Two: Contact Profiles & Tokens */}
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

      {/* Dotted Border Document Dropper */}
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
          {uploadedFile ? (
            <div style={{ textAlign: "center", padding: "10px" }}>
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>
                {uploadedFile.status === "Success" ? "✅" : "⏳"}
              </div>
              <div
                style={{
                  fontWeight: "700",
                  color: "#0a1d37",
                  fontSize: "16px",
                  marginBottom: "4px",
                }}
              >
                {uploadedFile.name}
              </div>

              <div
                style={{
                  display: "inline-block",
                  backgroundColor:
                    uploadedFile.status === "Success" ? "#ecfdf5" : "#fef3c7",
                  color:
                    uploadedFile.status === "Success" ? "#10b981" : "#d97706",
                  fontWeight: "bold",
                  fontSize: "13px",
                  padding: "4px 12px",
                  borderRadius: "4px",
                  border:
                    uploadedFile.status === "Success"
                      ? "1px solid #a7f3d0"
                      : "1px solid #fde68a",
                  marginTop: "4px",
                }}
              >
                Status: {uploadedFile.status}
              </div>

              {uploadedFile.status === "Success" && (
                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "12px",
                    color: "#667085",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    setUploadedFile(null);
                  }}
                >
                  Upload another file
                </div>
              )}
            </div>
          ) : (
            <>
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
                  {" "}
                  or Drag and Drop to upload Policy
                </span>
              </div>
            </>
          )}
        </label>
      </div>
    </div>
  );
};

export default DetailsView;
