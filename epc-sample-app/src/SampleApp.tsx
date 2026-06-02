import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Added for route navigation
import { isEncompassIframe, useEpc, EpcClient } from "./epc"; // [cite: 46]
/**
 * Template iframe application for a new EPC product.
 *
 * Replace "YourProduct" with your actual product component.
 * Update CONCEPT_PRODUCTS with your EPC product names.
 */ // [cite: 47, 48]

/** Product names that target the Encompass concept (non-prod) environment. */ 
const CONCEPT_PRODUCTS: any[] = [
  // [cite: 49]
  // 'yourcompany.yourproductdev.epc',
  // 'yourcompany.yourproductqa.epc',
];

const EncompassMode = () => {
  const { client, transactionOrigin, applicationInfo, loading, error } =
    useEpc(CONCEPT_PRODUCTS);
  const navigate = useNavigate(); // Hook for executing route redirections

  useEffect(() => {
    const processRoutingContext = async () => {
      // Wait silently until the useEpc hook successfully retrieves transaction context
      if (!transactionOrigin || !applicationInfo) return; 

      try {
        // Extract unique identifier string from the EPC framework transaction context dataset
        // --- ADD THESE DEBUGGER CONSOLE LOGS ---
        console.log("=== EPC DEBUGGING START ===");
        console.log(
          "1. Full transactionOrigin object from Encompass:",
          transactionOrigin,
        );

        // Safely grab the property combinations (handles both camelCase and snake_case framework variants)
        const currentTransactionId =
          (transactionOrigin as any).transactionId ||
          (transactionOrigin as any).transaction_id;

        console.log(
          "2. Extracted currentTransactionId is:",
          currentTransactionId,
        );
        console.log(
          "3. Session Launch wrapper ID (originId) is:",
          (transactionOrigin as any).id,
        );
        console.log("=== EPC DEBUGGING END ===");
       

        // Condition evaluation: check whether transaction is an existing ID or a new transaction
        if (currentTransactionId) {
          // Pass the data context keys along safely through the router state channel
          navigate(`/details/${currentTransactionId}`, {
            state: {
              originId: transactionOrigin.id,
              partnerAccessToken: transactionOrigin.partnerAccessToken,
              // [cite: 50] Pass the access token if needed for API calls in the details view
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
    const initializeStandalone = async () => {
      try {

        const partnerAccessToken = "TEST_TOKEN_123";
        const originId = "TEST123";

        const payload = {
          messageName: "epc_origin-R",
          origin_id: originId,
          partner_access_token: partnerAccessToken,
        };

        console.log(" FINAL PAYLOAD:", payload);

        navigate(`/details/${originId}`, {
          state: {
            originId,
            partnerAccessToken,
           
          },
        });
      } catch (error) {
        console.error("Failed to fetch access token:", error);
      }
    };

    initializeStandalone();
  }, [navigate]);

  return <h2>Standalone TEST</h2>;
};
const SampleApp = () => {
  const [mode, setMode] = useState<"loading" | "encompass" | "standalone">(
    () => {
      const detected = isEncompassIframe(); 

      if (detected === false) {
        return "standalone"; 
      }

      if (detected === true) {
        return "encompass";
      }

      return "loading";
    },
  );

  useEffect(() => {
   
    if (mode !== "loading") return;

    const probe = new EpcClient();
    probe
      .connect()
      .then(() => setMode("encompass"))
      .catch(() => setMode("standalone")); 
  }, [mode]);

  if (mode === "loading") return <div />;
  return mode === "encompass" ? <EncompassMode /> : <StandaloneMode />;
};

export default SampleApp;
