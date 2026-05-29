import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";

// Define the interface for the API response structure
interface LoanDetails {
  borrowerName: string;
  coBorrowerName: string;
  address: string;
  phoneNumber: string;
  email: string;
}

const DetailsView = () => {
  // Read the transactionId straight out of the URL path parameter
  const { transactionId } = useParams<{ transactionId: string }>();
  const location = useLocation();

  // Safely pull the forwarded state tokens passed during navigation
  const { originId, partnerAccessToken } =
    (location.state as { originId?: string; partnerAccessToken?: string }) ||
    {};

  const [loanData, setLoanData] = useState<LoanDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLoanDetails = async () => {
      try {
        setLoading(true);

        // Construct your payload using the received tokens
        const payload = {
          originId: originId || transactionId,
          partnerAccessToken: partnerAccessToken || "",
        };

        console.log(" Hitting backend endpoint with payload:", payload);

        // Send the POST request to your backend service endpoint
        const response = await fetch("/api/loan-details", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Server error: status ${response.status}`);
        }

        const data: LoanDetails = await response.json();
        console.log(" Successfully received loan details response:", data);
        setLoanData(data);
      } catch (err: any) {
        console.error(" Failed to fetch loan details:", err);
        setError(
          err?.message || "Something went wrong while retrieving loan details.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLoanDetails();
  }, [transactionId, originId, partnerAccessToken]);

  if (loading) {
    return (
      <div style={containerStyle}>
        <h3>Loading Loan Details...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <h3 style={{ color: "red" }}>Error: {error}</h3>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Loan Details UI Headings */}
      <h2 style={{ borderBottom: "2px solid #333", paddingBottom: "10px" }}>
        Loan Details
      </h2>

      {loanData ? (
        <table style={tableStyle}>
          <tbody>
            <tr>
              <td style={labelStyle}>Borrower Name:</td>
              <td style={valueStyle}>{loanData.borrowerName || "N/A"}</td>
            </tr>
            <tr>
              <td style={labelStyle}>Co-Borrower Name:</td>
              <td style={valueStyle}>{loanData.coBorrowerName || "N/A"}</td>
            </tr>
            <tr>
              <td style={labelStyle}>Property Address:</td>
              <td style={valueStyle}>{loanData.address || "N/A"}</td>
            </tr>
            <tr>
              <td style={labelStyle}>Phone Number:</td>
              <td style={valueStyle}>{loanData.phoneNumber || "N/A"}</td>
            </tr>
            <tr>
              <td style={labelStyle}>Email Address:</td>
              <td style={valueStyle}>{loanData.email || "N/A"}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p>No loan data profiles available for this record context.</p>
      )}
    </div>
  );
};

// CSS-in-JS Styling Objects
const containerStyle = {
  padding: "30px",
  fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
  maxWidth: "600px",
  margin: "0 auto",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
  marginTop: "20px",
};

const labelStyle = {
  padding: "12px 8px",
  fontWeight: "bold" as const,
  color: "#555",
  width: "35%",
  borderBottom: "1px solid #ddd",
};

const valueStyle = {
  padding: "12px 8px",
  color: "#111",
  borderBottom: "1px solid #ddd",
};

export default DetailsView;
