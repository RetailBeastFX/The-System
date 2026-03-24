import RiskRewardCalculator from "@/components/RiskRewardCalculator";

export const metadata = {
  title: "Risk Calculator | RetailBeastFX — The System",
  description: "Multi-asset risk management calculator for Forex, Stocks, Options, Futures, and Crypto. Know your risk before you click buy.",
};

export default function SystemPage() {
  return <RiskRewardCalculator />;
}
