import type { FormValues, CalculationResult, BrandLevel, RoundingMode } from '../types';

const PSYCHOLOGICAL_PRICES = [
  500, 600, 700, 800, 900,
  1000, 1200, 1500, 1800, 2000, 2200, 2500, 2800, 3000,
  3500, 3800, 4000, 4500, 5000,
  5800, 6800, 7800, 9800, 12000, 15000, 18000, 20000,
];

const BRAND_COEFFICIENTS: Record<BrandLevel, number> = {
  low: 1.05,
  standard: 1.15,
  high: 1.30,
};

function roundPrice(price: number, mode: RoundingMode, minimum: number): number {
  if (mode === 'psychological') {
    const candidates = PSYCHOLOGICAL_PRICES.filter((p) => p >= minimum);
    if (candidates.length === 0) {
      // fallback: round to nearest 100 above minimum
      return Math.ceil(minimum / 100) * 100;
    }
    // find closest candidate >= minimum
    let best = candidates[0];
    let bestDiff = Math.abs(candidates[0] - price);
    for (const p of candidates) {
      const diff = Math.abs(p - price);
      if (diff < bestDiff) {
        best = p;
        bestDiff = diff;
      }
    }
    return best;
  }

  const unit = parseInt(mode, 10);
  const rounded = Math.ceil(price / unit) * unit;
  // ensure minimum is met
  return rounded >= minimum ? rounded : Math.ceil(minimum / unit) * unit;
}

export function calculate(v: FormValues): CalculationResult {
  const warnings: string[] = [];

  if (v.totalEventItems <= 0) {
    warnings.push('販売予定数は1以上の値を入力してください。');
  }
  if (v.idealProfitRate >= 0.8) {
    warnings.push('理想利益率が80%以上に設定されています。価格が非常に高くなる可能性があります。');
  }
  const allInputs = [
    v.partsCost, v.hardwareCost, v.packagingCost, v.cardCost, v.otherMaterialCost,
    v.laborMinutes, v.hourlyRate, v.boothFee, v.parkingFee, v.transportFee,
    v.accommodationFee, v.displayFee, v.extraPackagingFee, v.otherEventCost,
    v.minimumProfit, v.idealProfitRate, v.thisItemCount,
  ];
  if (allInputs.some((n) => n < 0)) {
    warnings.push('マイナスの値が入力されています。数値を確認してください。');
  }

  const materialsCost =
    v.partsCost + v.hardwareCost + v.packagingCost + v.cardCost + v.otherMaterialCost;

  const laborCost = (v.laborMinutes / 60) * v.hourlyRate;

  const eventCostTotal =
    v.boothFee + v.parkingFee + v.transportFee + v.accommodationFee +
    v.displayFee + v.extraPackagingFee + v.otherEventCost;

  const eventCostPerItem =
    v.totalEventItems > 0 ? eventCostTotal / v.totalEventItems : 0;

  const totalCost = materialsCost + laborCost + eventCostPerItem;

  // 最低価格
  const rawMinimum = totalCost + v.minimumProfit;
  const minimumPrice = roundPrice(rawMinimum, v.roundingMode, rawMinimum);

  // 推奨価格
  const profitRateClamp = Math.min(v.idealProfitRate, 0.79);
  const candidate =
    profitRateClamp > 0 ? totalCost / (1 - profitRateClamp) : totalCost * 1.3;
  const rawRecommended = Math.max(candidate, minimumPrice * 1.1);
  const recommendedPrice = roundPrice(rawRecommended, v.roundingMode, minimumPrice);

  // ブランド価格
  const coeff = BRAND_COEFFICIENTS[v.brandLevel];
  const rawBrand = recommendedPrice * coeff;
  const brandPrice = roundPrice(rawBrand, v.roundingMode, recommendedPrice);

  // 警告: 価格が売れにくい水準か（ハンドメイドイベントでは5000円超は売れにくい）
  if (recommendedPrice > 8000) {
    warnings.push(
      'イベント経費が高いため、推奨価格が高めになっています。販売予定数を増やすか経費を見直してみましょう。'
    );
  }

  // 利益計算
  const profitAtMinimum = minimumPrice - totalCost;
  const profitAtRecommended = recommendedPrice - totalCost;
  const profitAtBrand = brandPrice - totalCost;

  const profitRateAtMinimum = minimumPrice > 0 ? profitAtMinimum / minimumPrice : 0;
  const profitRateAtRecommended = recommendedPrice > 0 ? profitAtRecommended / recommendedPrice : 0;
  const profitRateAtBrand = brandPrice > 0 ? profitAtBrand / brandPrice : 0;

  // 最低価格を下回る場合の警告
  if (minimumPrice > recommendedPrice) {
    warnings.push('推奨価格が最低価格を下回っています。利益率の設定を確認してください。');
  }

  return {
    materialsCost,
    laborCost,
    eventCostTotal,
    eventCostPerItem,
    totalCost,
    minimumPrice,
    recommendedPrice,
    brandPrice,
    profitAtMinimum,
    profitAtRecommended,
    profitAtBrand,
    profitRateAtMinimum,
    profitRateAtRecommended,
    profitRateAtBrand,
    warnings,
  };
}

export function formatCurrency(n: number): string {
  return `¥${Math.round(n).toLocaleString('ja-JP')}`;
}

export function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}
