import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Added for route navigation
import { isEncompassIframe, useEpc, EpcClient } from "./epc"; // [cite: 46]

/**
 * Template iframe application for a new EPC product.
 *
 * Replace "YourProduct" with your actual product component.
 * Update CONCEPT_PRODUCTS with your EPC product names.
 */ // [cite: 47, 48]

/** Product names that target the Encompass concept (non-prod) environment. */ // [cite: 49]
const CONCEPT_PRODUCTS: any[] = [
  // [cite: 49]
  // 'yourcompany.yourproductdev.epc',
  // 'yourcompany.yourproductqa.epc',
];

const EncompassMode = () => {
  const { client, transactionOrigin, applicationInfo, loading, error } =
    useEpc(CONCEPT_PRODUCTS); // [cite: 50]
  const navigate = useNavigate(); // Hook for executing route redirections

  useEffect(() => {
    const processRoutingContext = async () => {
      // Wait silently until the useEpc hook successfully retrieves transaction context
      if (!transactionOrigin || !applicationInfo) return; // [cite: 51]

      try {
        // Extract unique identifier string from the EPC framework transaction context dataset
        const currentTransactionId = transactionOrigin.id;

        // Condition evaluation: check whether transaction is an existing ID or a new transaction
        if (currentTransactionId) {
          console.log(
            ` Existing ID context detected. Moving to: /details/${currentTransactionId}`,
          );

          // Pass the data context keys along safely through the router state channel
          navigate(`/details/${currentTransactionId}`, {
            state: {
              originId: transactionOrigin.id,
              partnerAccessToken: transactionOrigin.partnerAccessToken,
            },
          });
        } else {
          // Else - navigate to new order view
          navigate("/order");
        }
      } catch (err) {
        console.error(
          "Failed to execute context evaluation navigation rules:",
          err,
        );
      }
    };

    if (!loading && !error) {
      processRoutingContext();
    }
  }, [transactionOrigin, applicationInfo, loading, error, navigate]); // [cite: 52]

  // SHOW LOADER: While useEpc is setting up or navigating, display an explicit loading state
  if (loading) return <div>Connecting to Encompass...</div>; // [cite: 53]
  if (error) return <div>Error: {error}</div>; // [cite: 53]

  // While routing transitions, prevent the old placeholder screen from blinking
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h2>Verifying Identity Context...</h2>
      <p>Please wait while we establish your secure workspace view.</p>
      <button type="button" onClick={() => client?.closeTransaction()}>
        Close
      </button>{" "}
      {/* [cite: 54] */}
    </div>
  );
};

const StandaloneMode = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 👇 simulate transaction id for testing
    const testTransactionId = "TEST123";

    if (testTransactionId) {
      console.log("Standalone → navigating to details");
      navigate(`/details/${testTransactionId}`);
    } else {
      console.log("Standalone → navigating to new order");
      navigate("/order");
    }
  }, [navigate]);

  return (
    <div>
      <h2>Standalone Mode - DEPLOY TEST</h2>
    </div>
  );
};
const SampleApp = () => {
  // [cite: 57]
  // Fixed the cascading render issue by wrapping the synchronous frame checks directly inside the state initializer closure
  const [mode, setMode] = useState<"loading" | "encompass" | "standalone">(
    () => {
      // [cite: 57]
      const detected = isEncompassIframe(); // [cite: 58]

      if (detected === false) {
        // [cite: 58]
        return "standalone"; // [cite: 58]
      } // [cite: 58]

      if (detected === true) {
        // [cite: 58]
        return "encompass"; // [cite: 58]
      } // [cite: 59]

      return "loading";
    },
  );

  useEffect(() => {
    // Only run asynchronous client validation handshake if initial detection checks were fully ambiguous ('loading')
    if (mode !== "loading") return;

    const probe = new EpcClient(); // [cite: 59]
    probe
      .connect() // [cite: 59]
      .then(() => setMode("encompass")) // [cite: 59]
      .catch(() => setMode("standalone")); // [cite: 59]
  }, [mode]);

  if (mode === "loading") return <div />;
  return mode === "encompass" ? <EncompassMode /> : <StandaloneMode />;
};

export default SampleApp;
