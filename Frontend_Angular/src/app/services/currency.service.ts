import { Injectable, signal } from '@angular/core';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateToInr: number; // 1 INR = X Currency
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  public static readonly CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
    INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateToInr: 1.0 },
    USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateToInr: 0.01202 },
    EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateToInr: 0.01105 },
    GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateToInr: 0.0078565 }
  };

  public readonly currentCurrency = signal<CurrencyCode>('INR');
  public readonly maskBalance = signal<boolean>(false);

  constructor() {
    this.initFromStorage();
  }

  private initFromStorage() {
    const savedCode = localStorage.getItem('yono_currency') as CurrencyCode;
    if (savedCode && CurrencyService.CURRENCIES[savedCode]) {
      this.currentCurrency.set(savedCode);
    }

    const savedMask = localStorage.getItem('yono_mask_balance');
    if (savedMask !== null) {
      this.maskBalance.set(savedMask === 'true');
    }

    // Also check yono_settings object
    const settingsStr = localStorage.getItem('yono_settings');
    if (settingsStr) {
      try {
        const parsed = JSON.parse(settingsStr);
        if (parsed?.currency && CurrencyService.CURRENCIES[parsed.currency as CurrencyCode]) {
          this.currentCurrency.set(parsed.currency as CurrencyCode);
        }
        if (typeof parsed?.maskBalance === 'boolean') {
          this.maskBalance.set(parsed.maskBalance);
        }
      } catch {
        // ignore
      }
    }
  }

  public setCurrency(code: CurrencyCode) {
    if (CurrencyService.CURRENCIES[code]) {
      this.currentCurrency.set(code);
      localStorage.setItem('yono_currency', code);
    }
  }

  public setMaskBalance(mask: boolean) {
    this.maskBalance.set(mask);
    localStorage.setItem('yono_mask_balance', String(mask));
  }

  public getSymbol(): string {
    const code = this.currentCurrency();
    return CurrencyService.CURRENCIES[code]?.symbol || '₹';
  }

  public format(amountInInr: number, forceUnmask = false): string {
    const code = this.currentCurrency();
    const config = CurrencyService.CURRENCIES[code] || CurrencyService.CURRENCIES.INR;
    
    if (this.maskBalance() && !forceUnmask) {
      return `${config.symbol}••••••`;
    }

    const converted = (amountInInr || 0) * config.rateToInr;
    const formattedNum = converted.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return `${config.symbol}${formattedNum}`;
  }

  public maskAccount(accountNoOrId: string, forceUnmask = false): string {
    if (!accountNoOrId) return '';
    if (this.maskBalance() && !forceUnmask) {
      const clean = accountNoOrId.trim();
      const visible = clean.length > 4 ? clean.slice(-4) : clean;
      return `•••• ${visible}`;
    }
    return accountNoOrId;
  }

  public convertInrToSelected(amountInInr: number): number {
    const code = this.currentCurrency();
    const config = CurrencyService.CURRENCIES[code] || CurrencyService.CURRENCIES.INR;
    return (amountInInr || 0) * config.rateToInr;
  }

  public convertSelectedToInr(amountInSelected: number): number {
    const code = this.currentCurrency();
    const config = CurrencyService.CURRENCIES[code] || CurrencyService.CURRENCIES.INR;
    return (amountInSelected || 0) / config.rateToInr;
  }
}
