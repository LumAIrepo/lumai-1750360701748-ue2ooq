import React from "react"
```typescript
import { Connection, PublicKey, AccountInfo } from '@solana/web3.js';
import { Program, AnchorProvider, web3 } from '@project-serum/anchor';

export interface OracleData {
  price: number;
  timestamp: number;
  confidence: number;
  status: 'active' | 'inactive' | 'stale';
}

export interface PriceUpdate {
  symbol: string;
  price: number;
  timestamp: number;
  source: string;
}

export class Oracle {
  private connection: Connection;
  private programId: PublicKey;
  private updateInterval: number;
  private priceFeeds: Map<string, OracleData>;

  constructor(
    connection: Connection,
    programId: string,
    updateInterval: number = 30000
  ) {
    this.connection = connection;
    this.programId = new PublicKey(programId);
    this.updateInterval = updateInterval;
    this.priceFeeds = new Map();
  }

  async initializeOracle(authority: PublicKey): Promise<string> {
    try {
      const [oraclePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('oracle'), authority.toBuffer()],
        this.programId
      );

      const transaction = new web3.Transaction();
      const instruction = web3.SystemProgram.createAccount({
        fromPubkey: authority,
        newAccountPubkey: oraclePda,
        lamports: await this.connection.getMinimumBalanceForRentExemption(1000),
        space: 1000,
        programId: this.programId,
      });

      transaction.add(instruction);
      const signature = await this.connection.sendTransaction(transaction, []);
      await this.connection.confirmTransaction(signature);

      return signature;
    } catch (error) {
      throw new Error(`Failed to initialize oracle: ${error}`);
    }
  }

  async updatePrice(
    symbol: string,
    price: number,
    authority: PublicKey
  ): Promise<string> {
    try {
      const [priceFeedPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('price_feed'), Buffer.from(symbol)],
        this.programId
      );

      const priceData: OracleData = {
        price,
        timestamp: Date.now(),
        confidence: 0.95,
        status: 'active',
      };

      this.priceFeeds.set(symbol, priceData);

      const transaction = new web3.Transaction();
      const signature = await this.connection.sendTransaction(transaction, []);
      await this.connection.confirmTransaction(signature);

      return signature;
    } catch (error) {
      throw new Error(`Failed to update price for ${symbol}: ${error}`);
    }
  }

  async getPrice(symbol: string): Promise<OracleData | null> {
    try {
      const [priceFeedPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('price_feed'), Buffer.from(symbol)],
        this.programId
      );

      const accountInfo = await this.connection.getAccountInfo(priceFeedPda);
      
      if (!accountInfo) {
        return this.priceFeeds.get(symbol) || null;
      }

      const cachedData = this.priceFeeds.get(symbol);
      if (cachedData && this.isDataFresh(cachedData.timestamp)) {
        return cachedData;
      }

      return this.deserializePriceData(accountInfo.data);
    } catch (error) {
      console.error(`Failed to get price for ${symbol}:`, error);
      return null;
    }
  }

  async getPrices(symbols: string[]): Promise<Map<string, OracleData>> {
    const prices = new Map<string, OracleData>();
    
    const pricePromises = symbols.map(async (symbol) => {
      const price = await this.getPrice(symbol);
      if (price) {
        prices.set(symbol, price);
      }
    });

    await Promise.all(pricePromises);
    return prices;
  }

  async subscribeToPriceUpdates(
    symbol: string,
    callback: (data: OracleData) => void
  ): Promise<number> {
    const [priceFeedPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('price_feed'), Buffer.from(symbol)],
      this.programId
    );

    return this.connection.onAccountChange(
      priceFeedPda,
      (accountInfo: AccountInfo<Buffer>) => {
        const priceData = this.deserializePriceData(accountInfo.data);
        if (priceData) {
          this.priceFeeds.set(symbol, priceData);
          callback(priceData);
        }
      }
    );
  }

  async unsubscribeFromPriceUpdates(subscriptionId: number): Promise<void> {
    await this.connection.removeAccountChangeListener(subscriptionId);
  }

  startPricePolling(symbols: string[]): void {
    setInterval(async () => {
      for (const symbol of symbols) {
        try {
          await this.refreshPrice(symbol);
        } catch (error) {
          console.error(`Failed to refresh price for ${symbol}:`, error);
        }
      }
    }, this.updateInterval);
  }

  private async refreshPrice(symbol: string): Promise<void> {
    const currentData = this.priceFeeds.get(symbol);
    
    if (!currentData || !this.isDataFresh(currentData.timestamp)) {
      const freshData = await this.getPrice(symbol);
      if (freshData) {
        this.priceFeeds.set(symbol, freshData);
      }
    }
  }

  private isDataFresh(timestamp: number): boolean {
    const maxAge = 60000; // 1 minute
    return Date.now() - timestamp < maxAge;
  }

  private deserializePriceData(data: Buffer): OracleData | null {
    try {
      if (data.length < 32) {
        return null;
      }

      const price = data.readBigUInt64LE(0);
      const timestamp = data.readBigUInt64LE(8);
      const confidence = data.readUInt32LE(16);
      const status = data.readUInt8(20);

      return {
        price: Number(price) / 1e8,
        timestamp: Number(timestamp),
        confidence: confidence / 1e6,
        status: status === 1 ? 'active' : status === 2 ? 'inactive' : 'stale',
      };
    } catch (error) {
      console.error('Failed to deserialize price data:', error);
      return null;
    }
  }

  async validatePriceData(symbol: string, expectedPrice: number, tolerance: number = 0.05): Promise<boolean> {
    const currentData = await this.getPrice(symbol);
    
    if (!currentData) {
      return false;
    }

    const priceDifference = Math.abs(currentData.price - expectedPrice) / expectedPrice;
    return priceDifference <= tolerance && currentData.status === 'active';
  }

  getOracleHealth(): { healthy: boolean; staleFeeds: string[]; inactiveFeeds: string[] } {
    const staleFeeds: string[] = [];
    const inactiveFeeds: string[] = [];

    for (const [symbol, data] of this.priceFeeds.entries()) {
      if (data.status === 'inactive') {
        inactiveFeeds.push(symbol);
      } else if (!this.isDataFresh(data.timestamp)) {
        staleFeeds.push(symbol);
      }
    }

    return {
      healthy: staleFeeds.length === 0 && inactiveFeeds.length === 0,
      staleFeeds,
      inactiveFeeds,
    };
  }
}

export const createOracle = (
  connection: Connection,
  programId: string,
  updateInterval?: number
): Oracle => {
  return new Oracle(connection, programId, updateInterval);
};

export const formatPrice = (price: number, decimals: number = 2): string => {
  return price.toFixed(decimals);
};

export const calculatePriceChange = (currentPrice: number, previousPrice: number): {
  absolute: number;
  percentage: number;
} => {
  const absolute = currentPrice - previousPrice;
  const percentage = (absolute / previousPrice) * 100;
  
  return { absolute, percentage };
};
```