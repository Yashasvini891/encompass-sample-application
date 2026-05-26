import host from "@elliemae/em-ssf-guest";
import type { TransactionRequest } from "@elliemae/em-ssf-guest";

export interface EpcTransactionOrigin {
  id: string;
  partnerAccessToken: string;
}

export interface EpcApplicationInfo {
  productName: string;
  environment: "concept" | "api";
}

/**
 * Reusable EPC (Encompass Partner Connect) client.
 * Wraps the @elliemae/em-ssf-guest SDK into a single class
 * that any iframe-based product can instantiate.
 */
export class EpcClient {
  private transactionObject: any;

  private applicationObject: any;

  private connected = false;

  private conceptProducts: string[];

  constructor(conceptProducts: string[] = []) {
    this.conceptProducts = conceptProducts;
  }

  /** Establish the SSF guest connection and retrieve SDK objects. */
  async connect(): Promise<void> {
    host.connect();
    host.ready();
    this.transactionObject = await host.getObject("transaction");
    this.applicationObject = await host.getObject("application");
    this.connected = true;
  }

  /** Returns true once connect() has resolved. */
  isConnected(): boolean {
    return this.connected;
  }

  /** Get the transaction origin (ID + partner access token). */
  async getTransactionOrigin(): Promise<EpcTransactionOrigin> {
    this.assertConnected();
    return this.transactionObject.getOrigin();
  }

  /** Refresh the transaction origin (e.g. after token expiry). */
  async refreshTransactionOrigin(): Promise<EpcTransactionOrigin> {
    this.assertConnected();
    return this.transactionObject.refreshOrigin();
  }

  /** Create a new EPC transaction. */
  async createTransaction(request: TransactionRequest): Promise<string> {
    this.assertConnected();
    return this.transactionObject.create(request);
  }

  /** Close the current transaction. */
  async closeTransaction(): Promise<void> {
    this.assertConnected();
    return this.transactionObject.close();
  }

  /** Decode the partner access token JWT to determine product name and environment. */
  async getApplicationInfo(): Promise<EpcApplicationInfo> {
    this.assertConnected();
    let productName = "";
    try {
      const origin = await this.transactionObject.getOrigin();
      if (origin?.partnerAccessToken) {
        const payload = origin.partnerAccessToken.split(".")[1];
        const decoded = JSON.parse(atob(payload));
        productName = decoded?.product_name ?? "";
      }
    } catch {
      // JWT decode error — productName stays empty
    }

    const environment = this.conceptProducts.includes(productName)
      ? "concept"
      : "api";
    return { productName, environment } as const;
  }

  /** Get application capabilities from the host. */
  async getApplicationCapabilities(): Promise<any> {
    this.assertConnected();
    return this.applicationObject.getCapabilities();
  }

  /** Open a resource in the Encompass host. */
  async openResource(resourceReference: any): Promise<void> {
    this.assertConnected();
    return this.applicationObject.open(resourceReference);
  }

  /** Open a resource in a modal within the Encompass host. */
  async openResourceInModal(resourceReference: any): Promise<void> {
    this.assertConnected();
    return this.applicationObject.openModal(resourceReference);
  }

  /** Perform a named action on the application object. */
  async performAction<T = any>(action: string): Promise<T> {
    this.assertConnected();
    return this.applicationObject.performAction(action);
  }

  private assertConnected(): void {
    if (!this.connected) {
      throw new Error("EpcClient is not connected. Call connect() first.");
    }
  }
}
// Add these to the absolute bottom of EpcClient.ts to guarantee export definitions match
export const EpcTransactionOrigin = {};
export const EpcApplicationInfo = {};
