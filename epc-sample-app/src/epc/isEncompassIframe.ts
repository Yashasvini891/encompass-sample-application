/** Known Encompass host origins. Add new ones as needed. */
const KNOWN_ENCOMPASS_ORIGINS = [
    'https://www.encompassloconnect.com',
    'https://prod-ha-2.ssf.epc.ellieservices.com',
    'https://epc-ha.encompass.ice.com',
];

/**
 * Detect whether the current window is running inside an Encompass iframe.
 *
 * Returns:
 *  - `true`  if window.location.ancestorOrigins matches a known host
 *  - `false` if running as the top-level window
 *  - `null`  if embedded in an unknown iframe (caller should try EPC connect and decide)
 */
export function isEncompassIframe(): boolean | null {
    if (window.top === window.self) return false;

    const origins = window.location?.ancestorOrigins;
    if (origins) {
        if (KNOWN_ENCOMPASS_ORIGINS.some((known) => origins.contains(known))) return true;
    }

    // Embedded in *some* iframe, but not a recognized Encompass host
    return null;
}
