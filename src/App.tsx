import { useState, useEffect, useCallback } from 'react';
import type { FormValues, BrandLevel, RoundingMode } from './types';
import { calculate, formatCurrency, formatPercent } from './utils/calculator';
import './App.css';

const STORAGE_KEY = 'accessory_simulator_v1';

const DEFAULT_VALUES: FormValues = {
  partsCost: 0,
  hardwareCost: 0,
  packagingCost: 0,
  cardCost: 0,
  otherMaterialCost: 0,
  laborMinutes: 30,
  hourlyRate: 1200,
  boothFee: 0,
  parkingFee: 0,
  transportFee: 0,
  accommodationFee: 0,
  displayFee: 0,
  extraPackagingFee: 0,
  otherEventCost: 0,
  totalEventItems: 30,
  thisItemCount: 1,
  targetRevenue: 0,
  minimumProfit: 200,
  idealProfitRate: 0.3,
  brandLevel: 'standard',
  roundingMode: '100',
};

const SAMPLE_VALUES: FormValues = {
  partsCost: 320,
  hardwareCost: 80,
  packagingCost: 60,
  cardCost: 40,
  otherMaterialCost: 0,
  laborMinutes: 25,
  hourlyRate: 1200,
  boothFee: 6500,
  parkingFee: 800,
  transportFee: 1500,
  accommodationFee: 0,
  displayFee: 2000,
  extraPackagingFee: 500,
  otherEventCost: 0,
  totalEventItems: 35,
  thisItemCount: 6,
  targetRevenue: 0,
  minimumProfit: 300,
  idealProfitRate: 0.3,
  brandLevel: 'standard',
  roundingMode: '100',
};

function loadFromStorage(): FormValues {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FormValues>;
      return { ...DEFAULT_VALUES, ...parsed };
    }
  } catch {
    // ignore
  }
  return DEFAULT_VALUES;
}

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  min?: number;
  hint?: string;
}

function NumberInput({ label, value, onChange, unit = '円', min = 0, hint }: NumberInputProps) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      {hint && <p className="field-hint">{hint}</p>}
      <div className="field-input-wrap">
        <input
          type="number"
          className="field-input"
          value={value === 0 ? '' : value}
          placeholder="0"
          min={min}
          onChange={(e) => {
            const n = parseFloat(e.target.value);
            onChange(isNaN(n) ? 0 : n);
          }}
        />
        <span className="field-unit">{unit}</span>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <section className="section">
      <h2 className="section-title">
        <span className="section-icon">{icon}</span>
        {title}
      </h2>
      <div className="section-body">{children}</div>
    </section>
  );
}

interface PriceCardProps {
  label: string;
  price: number;
  profit: number;
  profitRate: number;
  description: string;
  hint: string;
  color: 'neutral' | 'recommended' | 'brand';
}

function PriceCard({ label, price, profit, profitRate, description, hint, color }: PriceCardProps) {
  return (
    <div className={`price-card price-card--${color}`}>
      <div className="price-card-label">{label}</div>
      <div className="price-card-price">{formatCurrency(price)}</div>
      <div className="price-card-desc">{description}</div>
      <div className="price-card-metrics">
        <span>利益 {formatCurrency(profit)}</span>
        <span>利益率 {formatPercent(profitRate)}</span>
      </div>
      <div className="price-card-hint">{hint}</div>
    </div>
  );
}

export default function App() {
  const [form, setForm] = useState<FormValues>(loadFromStorage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {
      // ignore
    }
  }, [form]);

  const set = useCallback(<K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const canCalculate = form.totalEventItems > 0;
  const result = canCalculate ? calculate(form) : null;

  const costBreakdown = result
    ? [
        { label: '材料費', value: result.materialsCost },
        { label: '作業コスト', value: result.laborCost },
        { label: 'イベント経費 (按分)', value: result.eventCostPerItem },
      ]
    : [];

  const totalForBreakdown = result ? result.totalCost : 1;

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <h1 className="header-title">
            <span className="header-title-sub">ハンドメイド</span>
            <br />
            イベント販売価格シミュレーター
          </h1>
          <p className="header-desc">
            原価・制作時間・イベント経費を入力すると、適正な販売価格を自動で計算します
          </p>
          <div className="header-actions">
            <button className="btn btn-sample" onClick={() => setForm(SAMPLE_VALUES)}>
              サンプル入力
            </button>
            <button className="btn btn-reset" onClick={() => setForm(DEFAULT_VALUES)}>
              リセット
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="layout">
          {/* ===== 入力エリア ===== */}
          <div className="input-area">

            {/* A. 商品原価 */}
            <Section title="商品の原価" icon="🧵">
              <NumberInput label="パーツ代" value={form.partsCost} onChange={(v) => set('partsCost', v)} />
              <NumberInput label="金具代" value={form.hardwareCost} onChange={(v) => set('hardwareCost', v)} />
              <NumberInput label="梱包資材費" value={form.packagingCost} onChange={(v) => set('packagingCost', v)} />
              <NumberInput label="台紙・ショップカード費" value={form.cardCost} onChange={(v) => set('cardCost', v)} />
              <NumberInput label="その他材料費" value={form.otherMaterialCost} onChange={(v) => set('otherMaterialCost', v)} />
            </Section>

            {/* B. 制作コスト */}
            <Section title="制作コスト" icon="⏱">
              <NumberInput
                label="制作時間"
                value={form.laborMinutes}
                onChange={(v) => set('laborMinutes', v)}
                unit="分"
              />
              <NumberInput
                label="1時間あたりの作業単価"
                value={form.hourlyRate}
                onChange={(v) => set('hourlyRate', v)}
                hint="あなたの1時間の価値。初期値 1,200円"
              />
            </Section>

            {/* C. イベント出店コスト */}
            <Section title="イベント出店コスト" icon="🏪">
              <NumberInput label="ブース出店料" value={form.boothFee} onChange={(v) => set('boothFee', v)} />
              <NumberInput label="駐車場代" value={form.parkingFee} onChange={(v) => set('parkingFee', v)} />
              <NumberInput label="交通費" value={form.transportFee} onChange={(v) => set('transportFee', v)} />
              <NumberInput label="宿泊費（必要な場合）" value={form.accommodationFee} onChange={(v) => set('accommodationFee', v)} />
              <NumberInput label="ディスプレイ・什器費" value={form.displayFee} onChange={(v) => set('displayFee', v)} />
              <NumberInput label="包装追加費" value={form.extraPackagingFee} onChange={(v) => set('extraPackagingFee', v)} />
              <NumberInput label="その他イベント経費" value={form.otherEventCost} onChange={(v) => set('otherEventCost', v)} />
            </Section>

            {/* D. 売上想定 */}
            <Section title="売上想定" icon="📦">
              <NumberInput
                label="今回のイベントで販売予定数（全商品合計）"
                value={form.totalEventItems}
                onChange={(v) => set('totalEventItems', v)}
                unit="点"
                min={1}
                hint="イベント経費をこの数で按分します"
              />
              <NumberInput
                label="この商品の販売予定数"
                value={form.thisItemCount}
                onChange={(v) => set('thisItemCount', v)}
                unit="点"
                min={1}
              />
              <NumberInput
                label="目標売上金額（任意）"
                value={form.targetRevenue}
                onChange={(v) => set('targetRevenue', v)}
                hint="入力しなくても計算できます"
              />
            </Section>

            {/* E. 利益設定 */}
            <Section title="利益設定" icon="💰">
              <NumberInput
                label="最低限ほしい利益額"
                value={form.minimumProfit}
                onChange={(v) => set('minimumProfit', v)}
                hint="1個あたりの最低利益。制作の達成感にもなります"
              />
              <div className="field">
                <label className="field-label">理想利益率</label>
                <p className="field-hint">推奨: 20〜40%。高すぎると価格が上がりすぎます</p>
                <div className="field-input-wrap">
                  <input
                    type="number"
                    className="field-input"
                    value={Math.round(form.idealProfitRate * 100)}
                    placeholder="30"
                    min={0}
                    max={79}
                    onChange={(e) => {
                      const n = parseFloat(e.target.value);
                      set('idealProfitRate', isNaN(n) ? 0 : Math.min(n, 79) / 100);
                    }}
                  />
                  <span className="field-unit">%</span>
                </div>
              </div>
            </Section>

            {/* F. ブランド設定 */}
            <Section title="ブランド設定" icon="✨">
              <div className="field">
                <label className="field-label">ブランド価格帯</label>
                <p className="field-hint">ブランド価格への係数が変わります</p>
                <div className="radio-group">
                  {([
                    { value: 'low', label: '控えめ', sub: '×1.05　手に取りやすい価格感' },
                    { value: 'standard', label: '標準', sub: '×1.15　売れやすさとブランド感のバランス' },
                    { value: 'high', label: '高め', sub: '×1.30　作品の世界観を大切にしたい' },
                  ] as const).map((opt) => (
                    <label key={opt.value} className={`radio-label ${form.brandLevel === opt.value ? 'radio-label--active' : ''}`}>
                      <input
                        type="radio"
                        name="brandLevel"
                        value={opt.value}
                        checked={form.brandLevel === opt.value}
                        onChange={() => set('brandLevel', opt.value as BrandLevel)}
                      />
                      <span className="radio-text">
                        <span className="radio-main">{opt.label}</span>
                        <span className="radio-sub">{opt.sub}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </Section>

            {/* G. 価格丸め設定 */}
            <Section title="価格の丸め方" icon="🔢">
              <div className="field">
                <label className="field-label">丸め設定</label>
                <div className="radio-group">
                  {([
                    { value: '1', label: '1円単位', sub: '計算通りの価格' },
                    { value: '10', label: '10円単位', sub: 'キリのよい価格に' },
                    { value: '100', label: '100円単位（推奨）', sub: 'わかりやすい価格に' },
                    { value: 'psychological', label: '端数調整あり', sub: '1500・1800・2500円などの売れやすい価格帯に自動調整' },
                  ] as const).map((opt) => (
                    <label key={opt.value} className={`radio-label ${form.roundingMode === opt.value ? 'radio-label--active' : ''}`}>
                      <input
                        type="radio"
                        name="roundingMode"
                        value={opt.value}
                        checked={form.roundingMode === opt.value}
                        onChange={() => set('roundingMode', opt.value as RoundingMode)}
                      />
                      <span className="radio-text">
                        <span className="radio-main">{opt.label}</span>
                        <span className="radio-sub">{opt.sub}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </Section>
          </div>

          {/* ===== 結果エリア ===== */}
          <div className="result-area">
            <div className="result-sticky">

              {!canCalculate && (
                <div className="warning-box">
                  <p>⚠️ 販売予定数を1以上で入力すると結果が表示されます。</p>
                </div>
              )}

              {result && (
                <>
                  {/* 警告 */}
                  {result.warnings.length > 0 && (
                    <div className="warning-box">
                      {result.warnings.map((w, i) => (
                        <p key={i}>⚠️ {w}</p>
                      ))}
                    </div>
                  )}

                  {/* 主要価格カード */}
                  <div className="price-cards">
                    <PriceCard
                      label="最低価格"
                      price={result.minimumPrice}
                      profit={result.profitAtMinimum}
                      profitRate={result.profitRateAtMinimum}
                      description="赤字を避けるための下限目安"
                      hint="この価格を下回ると手出しになります"
                      color="neutral"
                    />
                    <PriceCard
                      label="推奨価格"
                      price={result.recommendedPrice}
                      profit={result.profitAtRecommended}
                      profitRate={result.profitRateAtRecommended}
                      description="売れやすさと利益のバランス目安"
                      hint="イベント会場で手に取ってもらいやすい価格帯です"
                      color="recommended"
                    />
                    <PriceCard
                      label="ブランド価格"
                      price={result.brandPrice}
                      profit={result.profitAtBrand}
                      profitRate={result.profitRateAtBrand}
                      description="世界観を守りやすい価格目安"
                      hint="作品の価値を伝えたいときはこの価格で"
                      color="brand"
                    />
                  </div>

                  {/* 内訳 */}
                  <div className="detail-card">
                    <h3 className="detail-title">原価の内訳</h3>
                    <div className="detail-rows">
                      <div className="detail-row">
                        <span className="detail-label">材料費合計</span>
                        <span className="detail-value">{formatCurrency(result.materialsCost)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">作業コスト</span>
                        <span className="detail-value">{formatCurrency(result.laborCost)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">イベント経費合計</span>
                        <span className="detail-value">{formatCurrency(result.eventCostTotal)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">1個あたりイベント経費</span>
                        <span className="detail-value">{formatCurrency(result.eventCostPerItem)}</span>
                      </div>
                      <div className="detail-row detail-row--total">
                        <span className="detail-label">総原価（1個あたり）</span>
                        <span className="detail-value">{formatCurrency(result.totalCost)}</span>
                      </div>
                    </div>

                    {/* 内訳バー */}
                    <div className="breakdown-bar-wrap">
                      {costBreakdown.map((item) => {
                        const pct = totalForBreakdown > 0
                          ? Math.max(0, Math.round((item.value / totalForBreakdown) * 100))
                          : 0;
                        return (
                          <div key={item.label} className="breakdown-bar-item">
                            <div className="breakdown-bar-label">
                              <span>{item.label}</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="breakdown-bar-bg">
                              <div
                                className="breakdown-bar-fill"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 目標売上との比較 */}
                  {form.targetRevenue > 0 && (
                    <div className="detail-card">
                      <h3 className="detail-title">目標売上との比較</h3>
                      <div className="detail-rows">
                        <div className="detail-row">
                          <span className="detail-label">目標売上</span>
                          <span className="detail-value">{formatCurrency(form.targetRevenue)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">推奨価格で全点販売した場合</span>
                          <span className="detail-value">
                            {formatCurrency(result.recommendedPrice * form.thisItemCount)}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">目標達成に必要な単価</span>
                          <span className="detail-value">
                            {form.thisItemCount > 0
                              ? formatCurrency(form.targetRevenue / form.thisItemCount)
                              : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ヒント */}
                  <div className="hint-box">
                    <h3 className="hint-title">💡 販売のヒント</h3>
                    <ul className="hint-list">
                      <li>
                        <strong>{formatCurrency(result.recommendedPrice)}</strong> は手に取りやすい価格帯です。
                        値引きせずに「丁寧な制作ストーリー」を添えると効果的です。
                      </li>
                      <li>
                        <strong>{formatCurrency(result.brandPrice)}</strong> はブランド感が出やすい価格です。
                        ラッピングや台紙にこだわると価格への納得感が生まれます。
                      </li>
                      {result.eventCostPerItem > result.materialsCost && (
                        <li>
                          イベント経費の比率が高めです。販売点数を増やすか、出店コストを見直すと利益率が改善します。
                        </li>
                      )}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>入力内容はブラウザに自動保存されます。計算結果はあくまで目安です。</p>
      </footer>
    </div>
  );
}
