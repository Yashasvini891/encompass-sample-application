import { useEffect, useRef, useState } from 'react';
import { EpcClient } from "./EpcClient";
import type { EpcApplicationInfo, EpcTransactionOrigin } from "./EpcClient";

export interface EpcState {
    client: EpcClient | null;
    connected: boolean;
    transactionOrigin: EpcTransactionOrigin | null;
    applicationInfo: EpcApplicationInfo | null;
    loading: boolean;
    error: string | null;
}

/**
 * React hook that initialises an EpcClient and runs the
 * standard startup sequence (connect -> getApplicationInfo -> getTransactionOrigin).
 *
 * @param conceptProducts - list of product names that target the "concept" environment
 */
export function useEpc(conceptProducts: string[] = []): EpcState {
    const clientRef = useRef<EpcClient | null>(null);
    const [connected, setConnected] = useState(false);
    const [transactionOrigin, setTransactionOrigin] = useState<EpcTransactionOrigin | null>(null);
    const [applicationInfo, setApplicationInfo] = useState<EpcApplicationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const client = new EpcClient(conceptProducts);
        clientRef.current = client;

        (async () => {
            try {
                await client.connect();
                if (cancelled) return;
                setConnected(true);

                const [appInfo, txnOrigin] = await Promise.all([
                    client.getApplicationInfo(),
                    client.getTransactionOrigin(),
                ]);

                if (cancelled) return;
                setApplicationInfo(appInfo);
                setTransactionOrigin(txnOrigin);
            } catch (err: any) {
                if (!cancelled) {
                    setError(err?.message ?? 'Failed to connect to Encompass');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, []);

    return {
        client: clientRef.current,
        connected,
        transactionOrigin,
        applicationInfo,
        loading,
        error,
    };
}
