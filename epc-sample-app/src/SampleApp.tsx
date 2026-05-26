import { useEffect, useState } from 'react';
import { isEncompassIframe, useEpc, EpcClient } from './epc';

/**
 * Template iframe application for a new EPC product.
 *
 * Replace "YourProduct" with your actual product component.
 * Update CONCEPT_PRODUCTS with your EPC product names.
 */

/** Product names that target the Encompass concept (non-prod) environment. */
const CONCEPT_PRODUCTS = [
    // 'yourcompany.yourproductdev.epc',
    // 'yourcompany.yourproductqa.epc',
];

const EncompassMode = () => {
    const { client, transactionOrigin, applicationInfo, loading, error } = useEpc(CONCEPT_PRODUCTS);

    useEffect(() => {
        if (transactionOrigin && applicationInfo) {
            // Call your backend origin endpoint here, e.g.:
            // fetch(`${API_BASE}/Origin`, {
            //     method: 'POST',
            //     body: JSON.stringify({
            //         partnerAccessToken: transactionOrigin.partnerAccessToken,
            //         originId: transactionOrigin.id,
            //     }),
            // });
        }
    }, [transactionOrigin, applicationInfo]);

    if (loading) return <div>Connecting to Encompass...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h2>Connected to Encompass</h2>
            <p>Product: {applicationInfo?.productName}</p>
            <p>Environment: {applicationInfo?.environment}</p>
            <p>Transaction ID: {transactionOrigin?.id}</p>
            {/* Render your product UI here */}
            <button type="button" onClick={() => client?.closeTransaction()}>Close</button>
        </div>
    );
};

const StandaloneMode = () => (
    <div>
        <h2>Standalone Mode</h2>
        {/* Your standalone (non-Encompass) UI here */}
    </div>
);

const SampleApp = () => {
    const [mode, setMode] = useState<'loading' | 'encompass' | 'standalone'>('loading');

    useEffect(() => {
        const detected = isEncompassIframe();

        if (detected === false) {
            setMode('standalone');
            return;
        }

        if (detected === true) {
            setMode('encompass');
            return;
        }

        // Unknown iframe — attempt EPC connection to decide
        const probe = new EpcClient();
        probe.connect()
            .then(() => setMode('encompass'))
            .catch(() => setMode('standalone'));
    }, []);

    if (mode === 'loading') return <div />;
    return mode === 'encompass' ? <EncompassMode /> : <StandaloneMode />;
};

export default SampleApp;
