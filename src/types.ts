export type BrandLevel = 'low' | 'standard' | 'high';
export type RoundingMode = '1' | '10' | '100' | 'psychological';

export interface FormValues {
  // A. 商品原価
  partsCost: number;
  hardwareCost: number;
  packagingCost: number;
  cardCost: number;
  otherMaterialCost: number;

  // B. 制作コスト
  laborMinutes: number;
  hourlyRate: number;

  // C. イベント出店コスト
  boothFee: number;
  parkingFee: number;
  transportFee: number;
  accommodationFee: number;
  displayFee: number;
  extraPackagingFee: number;
  otherEventCost: number;

  // D. 売上想定
  totalEventItems: number;
  thisItemCount: number;
  targetRevenue: number;

  // E. 利益設定
  minimumProfit: number;
  idealProfitRate: number;

  // F. ブランド設定
  brandLevel: BrandLevel;

  // G. 価格丸め設定
  roundingMode: RoundingMode;
}

export interface CalculationResult {
  materialsCost: number;
  laborCost: number;
  eventCostTotal: number;
  eventCostPerItem: number;
  totalCost: number;
  minimumPrice: number;
  recommendedPrice: number;
  brandPrice: number;
  profitAtMinimum: number;
  profitAtRecommended: number;
  profitAtBrand: number;
  profitRateAtMinimum: number;
  profitRateAtRecommended: number;
  profitRateAtBrand: number;
  warnings: string[];
}
