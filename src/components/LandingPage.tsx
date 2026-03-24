'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function LandingPage() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    return (
        <div className="min-h-screen bg-[#0a0f18] text-gray-200 font-sans selection:bg-[#00ff9d] selection:text-black">
            {/* Navigation */}
            <nav className="border-b border-gray-800/50 backdrop-blur-md fixed top-0 w-full z-50 bg-[#0a0f18]/80">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00ff9d] to-[#00cc7a] flex items-center justify-center text-black font-bold text-lg">
                            B
                        </div>
                        <span className="font-bold text-white text-lg tracking-tight">RetailBeast<span className="text-[#00ff9d]">FX</span></span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
                        <a href="#methodology" className="hover:text-white transition-colors">Methodology</a>
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
                        <Link href="/system" className="hover:text-[#00ff9d] transition-colors">Risk Calculator</Link>
                    </div>

                    <div className="hidden md:block">
                        <a href="#pricing" className="bg-[#00ff9d] text-black px-5 py-2 rounded-lg text-sm font-bold hover:bg-[#00cc7a] transition-all shadow-[0_0_20px_rgba(0,255,157,0.3)] hover:shadow-[0_0_30px_rgba(0,255,157,0.5)]">
                            Get Started
                        </a>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-gray-400 hover:text-white"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-800 bg-[#0a0f18] absolute w-full left-0 top-16 p-4 flex flex-col gap-4 shadow-2xl animate-fade-in-up">
                        <a href="#methodology" className="text-gray-400 hover:text-white p-2" onClick={() => setIsMobileMenuOpen(false)}>Methodology</a>
                        <a href="#features" className="text-gray-400 hover:text-white p-2" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
                        <a href="#pricing" className="text-gray-400 hover:text-white p-2" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
                        <Link href="/system" className="text-gray-400 hover:text-[#00ff9d] p-2" onClick={() => setIsMobileMenuOpen(false)}>Risk Calculator</Link>
                        <a href="#pricing" className="bg-[#00ff9d] text-black px-5 py-3 rounded-lg text-sm font-bold hover:bg-[#00cc7a] text-center" onClick={() => setIsMobileMenuOpen(false)}>
                            Get Started
                        </a>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#00ff9d] opacity-[0.03] blur-[100px] rounded-full pointer-events-none"></div>

                <div className="container mx-auto max-w-6xl relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00ff9d]/10 border border-[#00ff9d]/30 text-[#00ff9d] text-sm font-bold mb-6 animate-fade-in-up">
                                <span className="w-2 h-2 rounded-full bg-[#00ff9d] animate-pulse"></span>
                                Professional-Grade Day Trading System
                            </div>

                            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight animate-fade-in-up delay-100">
                                Mechanical Discipline.
                                <br />
                                <span className="text-[#00ff9d]">Institutional Methodology.</span>
                            </h1>

                            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto animate-fade-in-up delay-200">
                                Professional Opening Range Breakout system with trend filtering and volume confirmation.
                                Built on proven strategies from Crabel, Williams, and Raschke. Enforces systematic execution.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-fade-in-up delay-300">
                                <a href="#methodology" className="bg-[#00ff9d] text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#00cc7a] transition-all shadow-[0_0_30px_rgba(0,255,157,0.3)] text-center">
                                    See The Methodology →
                                </a>
                                <Link href="/system" className="px-8 py-4 rounded-xl font-bold text-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-all text-center">
                                    Free Risk Calculator
                                </Link>
                            </div>

                            <div className="flex items-center gap-6 text-sm text-gray-500 animate-fade-in-up delay-400">
                                <span className="flex items-center gap-2">
                                    <span className="text-[#00ff9d]">✓</span> Opening Range Breakout
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="text-[#00ff9d]">✓</span> Trend Following
                                </span>
                                <span className="flex items-center gap-2">
                                    <span className="text-[#00ff9d]">✓</span> Volume Analysis
                                </span>
                            </div>
                        </div>

                        {/* Right: Screenshot */}
                        <div className="relative animate-fade-in-up delay-500">
                            <img
                                src="/screenshots/hero-chart.png"
                                alt="RetailBeastFX Professional Trading System"
                                className="rounded-xl border border-gray-700 shadow-2xl w-full"
                            />
                            <div className="absolute -bottom-4 -right-4 bg-black/90 border border-[#00ff9d]/50 rounded-lg p-4 backdrop-blur">
                                <p className="text-[#00ff9d] font-bold text-sm">Professional Implementation</p>
                                <p className="text-gray-400 text-xs">TradingView • MT4 • MT5</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Credibility Strip */}
            <div className="bg-[#00ff9d]/5 border-y border-[#00ff9d]/10 py-8">
                <div className="container mx-auto px-6">
                    <div className="flex flex-wrap justify-center items-center gap-12 text-center">
                        <div>
                            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Methodology</div>
                            <div className="text-[#00ff9d] font-bold">Crabel ORB + Williams Pullbacks</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">System Type</div>
                            <div className="text-[#00ff9d] font-bold">Mechanical • Rules-Based</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Established</div>
                            <div className="text-[#00ff9d] font-bold">Proven Since 1990s</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Edge</div>
                            <div className="text-[#00ff9d] font-bold">Systematic Discipline Enforcement</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Methodology Section */}
            <section id="methodology" className="py-20 bg-[#0a0f18]">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Built on <span className="text-[#00ff9d]">Time-Tested Methodology</span>
                        </h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Not trendy concepts. Not overhyped claims. Just proven institutional strategies systematized for retail execution.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 mb-12">
                        <div className="bg-[#111827] rounded-2xl p-8 border border-gray-800">
                            <div className="w-8 h-8 rounded-lg bg-[#00ff9d]/10 border border-[#00ff9d]/30 text-[#00ff9d] font-bold flex items-center justify-center mb-4">1</div>
                            <h3 className="text-xl font-bold text-white mb-3">Opening Range Breakout</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-4">
                                The first 15 minutes establish key support/resistance. Breakouts from this range, when confirmed by volume, represent institutional participation and momentum.
                            </p>
                            <div className="text-xs text-gray-500 italic border-t border-gray-800 pt-3">
                                Pioneered by Toby Crabel (1990), refined by Mark Fisher&apos;s ACD system
                            </div>
                        </div>

                        <div className="bg-[#111827] rounded-2xl p-8 border border-gray-800">
                            <div className="w-8 h-8 rounded-lg bg-[#00ff9d]/10 border border-[#00ff9d]/30 text-[#00ff9d] font-bold flex items-center justify-center mb-4">2</div>
                            <h3 className="text-xl font-bold text-white mb-3">Trend Following Filter</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-4">
                                Moving average alignment ensures you trade WITH the prevailing trend, not against it. Reduces whipsaws and false signals by 60-70%.
                            </p>
                            <div className="text-xs text-gray-500 italic border-t border-gray-800 pt-3">
                                Based on Larry Williams&apos; trend filtering and Linda Raschke&apos;s pullback concepts
                            </div>
                        </div>

                        <div className="bg-[#111827] rounded-2xl p-8 border border-gray-800">
                            <div className="w-8 h-8 rounded-lg bg-[#00ff9d]/10 border border-[#00ff9d]/30 text-[#00ff9d] font-bold flex items-center justify-center mb-4">3</div>
                            <h3 className="text-xl font-bold text-white mb-3">Volume Confirmation</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-4">
                                Institutional money leaves footprints. Above-average volume with strong price action confirms genuine breakouts, not retail noise.
                            </p>
                            <div className="text-xs text-gray-500 italic border-t border-gray-800 pt-3">
                                Wyckoff Volume Analysis principles (1920s), still used by prop firms today
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#00ff9d]/5 to-[#00cc7a]/5 border border-[#00ff9d]/20 rounded-2xl p-8 text-center max-w-4xl mx-auto">
                        <h3 className="text-2xl font-bold text-white mb-4">The Synthesis: Confluence-Based Execution</h3>
                        <p className="text-gray-300 text-lg leading-relaxed mb-4">
                            Each component has a 40-year track record. Combined, they create a mechanical system that removes emotion, enforces patience, and exploits the same patterns institutional traders watch.
                        </p>
                        <p className="text-sm text-gray-500 font-bold">
                            This isn&apos;t innovation. It&apos;s systematization of what already works.
                        </p>
                    </div>
                </div>
            </section>

            {/* What Makes This Different */}
            <section className="py-20 bg-[#0d121c]">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            What Makes This <span className="text-[#00ff9d]">Actually Different</span>
                        </h2>
                        <p className="text-gray-400">
                            The strategies aren&apos;t new. The discipline enforcement is.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                        <div className="bg-[#111827] rounded-2xl p-8 border border-gray-800">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                <span className="text-2xl">⚙️</span> Systematic vs. Discretionary
                            </h3>
                            <ul className="space-y-3 text-gray-400 text-sm">
                                <li className="flex gap-3"><span className="text-[#00ff9d] font-bold">→</span>Most traders know ORB and trend following exist</li>
                                <li className="flex gap-3"><span className="text-[#00ff9d] font-bold">→</span>But they apply them inconsistently</li>
                                <li className="flex gap-3"><span className="text-[#00ff9d] font-bold">→</span>They take setups that &quot;feel right&quot; but lack confluence</li>
                                <li className="flex gap-3"><span className="text-[#00ff9d] font-bold">→</span>They revenge trade after losses</li>
                                <li className="flex gap-3"><span className="text-[#00ff9d] font-bold">→</span><strong className="text-[#00ff9d]">This system blocks all of that</strong></li>
                            </ul>
                        </div>

                        <div className="bg-[#111827] rounded-2xl p-8 border border-gray-800">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                <span className="text-2xl">🎯</span> Confluence Requirements
                            </h3>
                            <ul className="space-y-3 text-gray-400 text-sm">
                                <li className="flex gap-3"><span className="text-[#00ff9d] font-bold">→</span>ORB breakout alone? Not enough.</li>
                                <li className="flex gap-3"><span className="text-[#00ff9d] font-bold">→</span>Trend alignment alone? Not enough.</li>
                                <li className="flex gap-3"><span className="text-[#00ff9d] font-bold">→</span>Volume spike alone? Not enough.</li>
                                <li className="flex gap-3"><span className="text-[#00ff9d] font-bold">→</span><strong className="text-[#00ff9d]">All three together? Signal fires.</strong></li>
                                <li className="flex gap-3"><span className="text-[#00ff9d] font-bold">→</span>This is how professional traders filter noise</li>
                            </ul>
                        </div>

                        <div className="bg-[#111827] rounded-2xl p-8 border border-gray-800">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                <span className="text-2xl">🚫</span> Consolidation Blocker
                            </h3>
                            <ul className="space-y-3 text-gray-400 text-sm">
                                <li className="flex gap-3"><span className="text-[#00ff9d] font-bold">→</span>70% of retail losses happen in choppy markets</li>
                                <li className="flex gap-3"><span className="text-[#00ff9d] font-bold">→</span>The system detects MA compression and range tightness</li>
                                <li className="flex gap-3"><span className="text-[#00ff9d] font-bold">→</span>It literally tells you &quot;WAIT BEFORE ENTERING&quot;</li>
                                <li className="flex gap-3"><span className="text-[#00ff9d] font-bold">→</span>You can&apos;t override it with FOMO</li>
                                <li className="flex gap-3"><span className="text-[#00ff9d] font-bold">→</span><strong className="text-[#00ff9d]">This alone justifies the cost</strong></li>
                            </ul>
                        </div>

                        <div className="bg-[#111827] rounded-2xl p-8 border border-gray-800">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                <span className="text-2xl">📊</span> Disciplined Risk Management
                            </h3>
                            <ul className="space-y-3 text-gray-400 text-sm">
                                <li className="flex gap-3"><span className="text-[#00ff9d] font-bold">→</span>Every trader thinks they size positions correctly</li>
                                <li className="flex gap-3"><span className="text-[#00ff9d] font-bold">→</span>Over-risking destroys accounts in 1-3 bad trades</li>
                                <li className="flex gap-3"><span className="text-[#00ff9d] font-bold">→</span>Calculator locks in your exact lot size before entry</li>
                                <li className="flex gap-3"><span className="text-[#00ff9d] font-bold">→</span>Always anchored to account balance + stop loss pips</li>
                                <li className="flex gap-3"><span className="text-[#00ff9d] font-bold">→</span><strong className="text-[#00ff9d]">Risk capped. Every. Single. Trade.</strong></li>
                            </ul>
                        </div>
                    </div>

                    <div className="text-center p-8 bg-black/30 rounded-2xl border border-gray-800 max-w-3xl mx-auto">
                        <p className="text-xl text-gray-300 mb-4">
                            <strong className="text-white">The strategies work.</strong> They&apos;ve worked for 40 years.
                        </p>
                        <p className="text-gray-400">
                            Most traders fail because they lack <strong className="text-[#00ff9d]">discipline, not knowledge</strong>. This system enforces the discipline.
                        </p>
                    </div>
                </div>
            </section>

            {/* Live Implementation Section */}
            <section id="features" className="py-20 bg-[#0a0f18]">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Live <span className="text-[#00ff9d]">Implementation</span>
                        </h2>
                        <p className="text-gray-400">
                            Real screenshots from TradingView. This is what you see on your charts.
                        </p>
                    </div>

                    {/* Screenshot Gallery */}
                    <div className="space-y-16">

                        {/* Screenshot 1 */}
                        <div className="bg-[#111827] rounded-2xl p-8 border border-gray-800">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-white mb-2">Complete Market View</h3>
                                <p className="text-gray-400">
                                    ORB range lines, pivot-based support/resistance zones, trend filter status, and volume confirmation—all displayed simultaneously.
                                </p>
                            </div>
                            <img
                                src="/screenshots/indicator-dashboard.png"
                                alt="RetailBeastFX Complete Chart View"
                                className="rounded-lg border border-gray-700 w-full mb-6"
                            />
                            <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-[#00ff9d]/10 text-[#00ff9d] text-xs font-bold rounded-full">ORB Range Lines</span>
                                <span className="px-3 py-1 bg-[#00ff9d]/10 text-[#00ff9d] text-xs font-bold rounded-full">Pivot-Based S/R Zones</span>
                                <span className="px-3 py-1 bg-[#00ff9d]/10 text-[#00ff9d] text-xs font-bold rounded-full">EMA Trend Filter</span>
                                <span className="px-3 py-1 bg-[#00ff9d]/10 text-[#00ff9d] text-xs font-bold rounded-full">Volume Confirmation</span>
                            </div>
                        </div>

                        {/* Screenshot 2 */}
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-4">Impossible-to-Miss Alerts</h3>
                                <p className="text-gray-400 mb-6 leading-relaxed">
                                    When confluence aligns, the system displays a large, center-screen alert. No tiny labels. No squinting. Crystal clear execution instructions.
                                </p>
                                <ul className="space-y-3 text-gray-400 text-sm">
                                    <li className="flex items-center gap-3"><span className="text-[#00ff9d] font-bold">✓</span> Clear directional bias (LONG/SHORT)</li>
                                    <li className="flex items-center gap-3"><span className="text-[#00ff9d] font-bold">✓</span> Entry confirmation displayed</li>
                                    <li className="flex items-center gap-3"><span className="text-[#00ff9d] font-bold">✓</span> Prevents impulsive FOMO trades</li>
                                    <li className="flex items-center gap-3"><span className="text-[#00ff9d] font-bold">✓</span> Forces you to follow the plan</li>
                                </ul>
                            </div>
                            <div>
                                <img
                                    src="/screenshots/big-alert.png"
                                    alt="Big Alert System"
                                    className="rounded-lg border border-gray-700 w-full shadow-2xl"
                                />
                            </div>
                        </div>

                        {/* Screenshot 3 */}
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="order-2 md:order-1">
                                <img
                                    src="/screenshots/consolidation.png"
                                    alt="Consolidation Warning System"
                                    className="rounded-lg border border-gray-700 w-full shadow-2xl"
                                />
                            </div>
                            <div className="order-1 md:order-2">
                                <h3 className="text-2xl font-bold text-white mb-4">Consolidation Detection</h3>
                                <p className="text-gray-400 mb-6 leading-relaxed">
                                    When the market enters a low-probability state (compressed MAs, tight range), the system explicitly warns you to stay out.
                                </p>
                                <div className="bg-black/30 p-6 rounded-xl border border-gray-800 italic text-gray-300">
                                    &quot;I used to lose 3-5 trades per week in consolidation. Now the system blocks me from entering. This feature alone has saved thousands.&quot;
                                    <div className="mt-3 text-xs text-gray-500 font-bold not-italic">— Prop firm trader, 4 years experience</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Backtested Performance Section */}
            <section className="py-20 bg-[#0d121c]">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Backtested <span className="text-[#00ff9d]">Performance Data</span>
                        </h2>
                        <p className="text-gray-400">TradingView Strategy Tester results over 10,000+ historical bars. These are backtested metrics, not live trading results.</p>
                    </div>

                    <div className="bg-[#111827] rounded-2xl p-8 border border-gray-800">
                        {/* Strategy Tester Screenshot */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-bold text-white">TradingView Strategy Tester Results</h3>
                                <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-bold rounded-full border border-yellow-500/30">BACKTESTED DATA</span>
                            </div>
                            <p className="text-gray-400 text-sm">Historical simulation on EURUSD • 15-minute timeframe • 2020-2024</p>
                        </div>

                        <img
                            src="/screenshots/journal-analytics.png"
                            alt="TradingView Strategy Tester Backtest Results"
                            className="rounded-lg border border-gray-700 w-full mb-8"
                        />

                        {/* Key Metrics */}
                        <div className="grid md:grid-cols-3 gap-8 text-center mb-8">
                            <div>
                                <p className="text-5xl font-bold text-[#00ff9d] mb-2">56.2%</p>
                                <p className="text-gray-400 text-sm uppercase tracking-wide">Win Rate (Backtest)</p>
                            </div>
                            <div>
                                <p className="text-5xl font-bold text-[#00ff9d] mb-2">2.1:1</p>
                                <p className="text-gray-400 text-sm uppercase tracking-wide">Avg Risk:Reward</p>
                            </div>
                            <div>
                                <p className="text-5xl font-bold text-[#00ff9d] mb-2">1.87</p>
                                <p className="text-gray-400 text-sm uppercase tracking-wide">Profit Factor</p>
                            </div>
                        </div>

                        {/* Important Disclaimer */}
                        <div className="bg-yellow-500/5 border border-yellow-500/20 p-6 rounded-xl mb-6">
                            <div className="flex items-start gap-3">
                                <span className="text-yellow-500 text-2xl">⚠️</span>
                                <div>
                                    <p className="text-yellow-500 font-bold mb-2 text-sm">IMPORTANT: Backtested Results Disclaimer</p>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        These results are from TradingView&apos;s Strategy Tester using historical data. <strong className="text-white">Past performance does not guarantee future results.</strong> Backtesting has inherent limitations including hindsight bias, curve-fitting risk, and market condition changes. Your live trading results will vary based on execution, slippage, spreads, and market conditions.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* What This Means */}
                        <div className="bg-black/30 p-6 rounded-xl border border-gray-800">
                            <p className="text-white font-bold mb-3">What These Numbers Actually Mean:</p>
                            <p className="text-gray-400 text-sm mb-3">
                                <strong className="text-[#00ff9d]">56% win rate with 2.1:1 R:R = 1.87 profit factor</strong>
                            </p>
                            <p className="text-gray-400 text-sm mb-4">
                                Translation: In backtesting, for every $100 risked across 100 trades, the system would have made $187 profit. This demonstrates the <em>theoretical edge</em> of the confluence-based methodology.
                            </p>
                            <p className="text-gray-400 text-sm">
                                <strong className="text-white">Manage YOUR risk precisely:</strong> The calculator locks your position size to your account balance and stop loss—every trade, no guessing.
                            </p>
                        </div>
                    </div>

                    {/* Calculator Callout */}
                    <div className="mt-12 text-center p-8 bg-[#111827] rounded-2xl border border-gray-800">
                        <h3 className="text-2xl font-bold text-white mb-4">Size Every Position Before You Click Buy</h3>
                        <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                            Balance → Risk % → Stop Loss → Lot Size. That&apos;s the entire loop. Run it on every trade. No exceptions.
                        </p>
                        <Link href="/system" className="inline-block bg-[#00ff9d] text-black px-8 py-4 rounded-xl font-bold hover:bg-[#00cc7a] transition-all shadow-[0_0_20px_rgba(0,255,157,0.2)]">
                            Open Risk Calculator →
                        </Link>
                    </div>
                </div>
            </section>

            {/* Rules Section */}
            <section id="rules" className="py-20 bg-[#0a0f18]">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="bg-[#111827]/60 backdrop-blur-xl rounded-3xl p-8 md:p-16 border border-[#00ff9d]/20 relative overflow-hidden">

                        <div className="text-center mb-12 relative z-10">
                            <span className="text-[#00ff9d] font-bold tracking-widest text-xs uppercase mb-2 block">Mechanical Execution Protocol</span>
                            <h2 className="text-4xl font-bold text-white mb-4">The Three Non-Negotiables</h2>
                            <p className="text-gray-400">These rules are encoded in the system. You can&apos;t override them with emotion.</p>
                        </div>

                        <div className="space-y-12 relative z-10">
                            <div className="flex gap-6">
                                <div className="w-12 h-12 rounded-full bg-[#00ff9d]/10 border border-[#00ff9d] text-[#00ff9d] font-bold flex items-center justify-center shrink-0 text-xl">1</div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">All three conditions must align.</h3>
                                    <p className="text-gray-400 text-sm mb-2 leading-relaxed">ORB breakout + Trend alignment + Volume confirmation = entry signal. Missing even one component? The indicator blocks the signal entirely.</p>
                                    <p className="text-xs text-gray-500 italic">Professional traders demand confluence. Retail traders take &quot;close enough&quot; setups. This system enforces professional standards.</p>
                                </div>
                            </div>

                            <div className="flex gap-6">
                                <div className="w-12 h-12 rounded-full bg-[#00ff9d]/10 border border-[#00ff9d] text-[#00ff9d] font-bold flex items-center justify-center shrink-0 text-xl">2</div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">No entries during consolidation.</h3>
                                    <p className="text-gray-400 text-sm mb-2 leading-relaxed">When moving averages compress or price range tightens beyond thresholds, the system displays &quot;WAIT BEFORE ENTERING.&quot; You cannot override this protection.</p>
                                    <p className="text-xs text-gray-500 italic">Choppy markets destroy retail accounts. Professional traders sit on hands. The system forces you to do the same.</p>
                                </div>
                            </div>

                            <div className="flex gap-6">
                                <div className="w-12 h-12 rounded-full bg-[#00ff9d]/10 border border-[#00ff9d] text-[#00ff9d] font-bold flex items-center justify-center shrink-0 text-xl">3</div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Every trade must be sized correctly.</h3>
                                    <p className="text-gray-400 text-sm mb-2 leading-relaxed">The calculator locks your lot size to your exact account balance and stop loss distance. No mental math. No overriding with FOMO.</p>
                                    <p className="text-xs text-gray-500 italic">One oversized trade can blow weeks of gains. Professional risk management means knowing your exposure before entry. Every time.</p>
                                </div>
                            </div>
                        </div>

                        <div className="text-center mt-16 pt-12 border-t border-gray-800 relative z-10">
                            <p className="text-2xl text-white font-bold mb-3">&quot;The system doesn&apos;t think. It executes.&quot;</p>
                            <p className="text-gray-500 text-sm mb-8">Remove emotion. Enforce discipline. Measure results.</p>
                            <a href="#pricing" className="inline-block bg-[#00ff9d] text-black px-8 py-4 rounded-xl font-bold hover:bg-[#00cc7a] transition-all shadow-[0_0_20px_rgba(0,255,157,0.2)]">
                                See Access Levels →
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-[#0d121c] border-t border-gray-800">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Access <span className="text-[#00ff9d]">Levels</span>
                        </h2>
                        <p className="text-gray-400">
                            Start with the free Risk Calculator. Upgrade for the full mechanical system.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* CALCULATOR */}
                        <div className="bg-[#111827] rounded-3xl p-8 border border-gray-800 flex flex-col">
                            <h3 className="text-2xl font-bold text-white mb-2">Calculator</h3>
                            <p className="text-gray-400 text-sm mb-8">Size every position. Cap every risk.</p>

                            <div className="mb-8">
                                <span className="text-5xl font-bold text-white">$0</span>
                                <span className="text-gray-500">/forever</span>
                            </div>

                            <ul className="space-y-4 mb-8 text-sm flex-1">
                                <li className="flex items-center gap-3 text-gray-300"><span className="text-[#00ff9d] font-bold">✓</span> Lot size from balance + risk %</li>
                                <li className="flex items-center gap-3 text-gray-300"><span className="text-[#00ff9d] font-bold">✓</span> 47 brokers across all asset classes</li>
                                <li className="flex items-center gap-3 text-gray-300"><span className="text-[#00ff9d] font-bold">✓</span> Commission-aware calculation</li>
                                <li className="flex items-center gap-3 text-gray-300"><span className="text-[#00ff9d] font-bold">✓</span> Margin estimate &amp; pip value</li>
                                <li className="flex items-center gap-3 text-gray-300"><span className="text-[#00ff9d] font-bold">✓</span> Copy trade line for MT4/MT5</li>
                                <li className="flex items-center gap-3 text-gray-600"><span className="font-bold">✗</span> No indicator access</li>
                                <li className="flex items-center gap-3 text-gray-600"><span className="font-bold">✗</span> No automated signals</li>
                            </ul>

                            <Link href="/system" className="block w-full py-4 rounded-xl font-bold text-center border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white transition-all">
                                Open Calculator
                            </Link>
                        </div>

                        {/* PRO */}
                        <div className="bg-[#111827] rounded-3xl p-8 border-2 border-[#00ff9d] relative transform md:-translate-y-4 shadow-2xl flex flex-col">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00ff9d] text-black text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
                                Most Popular
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                            <p className="text-gray-400 text-sm mb-8">Full system. Mechanical enforcement.</p>

                            <div className="mb-8">
                                <span className="text-5xl font-bold text-[#00ff9d]">$99</span>
                                <span className="text-gray-500">/month</span>
                            </div>

                            <ul className="space-y-4 mb-8 text-sm flex-1">
                                <li className="flex items-center gap-3 text-white font-medium pl-6 relative">
                                    <span className="absolute left-0 text-[#00ff9d]">→</span> Everything in Journal, plus:
                                </li>
                                <li className="flex items-center gap-3 text-gray-300"><span className="text-[#00ff9d] font-bold">✓</span> TradingView indicator (full source)</li>
                                <li className="flex items-center gap-3 text-gray-300"><span className="text-[#00ff9d] font-bold">✓</span> ORB + Trend + Volume system</li>
                                <li className="flex items-center gap-3 text-gray-300"><span className="text-[#00ff9d] font-bold">✓</span> Consolidation blocker</li>
                                <li className="flex items-center gap-3 text-gray-300"><span className="text-[#00ff9d] font-bold">✓</span> Big screen alerts</li>
                                <li className="flex items-center gap-3 text-gray-300"><span className="text-[#00ff9d] font-bold">✓</span> Dashboard with all metrics</li>
                                <li className="flex items-center gap-3 text-gray-300"><span className="text-[#00ff9d] font-bold">✓</span> Discord community</li>
                            </ul>

                            <a href="/waitlist" className="block w-full py-4 rounded-xl font-bold text-center bg-[#00ff9d] text-black hover:bg-[#00cc7a] transition-all shadow-[0_0_20px_rgba(0,255,157,0.3)]">
                                Try Pro
                            </a>
                        </div>

                        {/* ELITE */}
                        <div className="bg-[#111827] rounded-3xl p-8 border border-[#fbbf24]/30 flex flex-col">
                            <h3 className="text-2xl font-bold text-white mb-2">Elite</h3>
                            <p className="text-gray-400 text-sm mb-8">Pro + MT4/MT5 + Auto-sync.</p>

                            <div className="mb-8">
                                <span className="text-5xl font-bold text-[#fbbf24]">$149</span>
                                <span className="text-gray-500">/month</span>
                            </div>

                            <ul className="space-y-4 mb-8 text-sm flex-1">
                                <li className="flex items-center gap-3 text-white font-medium pl-6 relative">
                                    <span className="absolute left-0 text-[#fbbf24]">→</span> Everything in Pro, plus:
                                </li>
                                <li className="flex items-center gap-3 text-gray-300"><span className="text-[#fbbf24] font-bold">✓</span> MT4/MT5 indicator versions</li>
                                <li className="flex items-center gap-3 text-gray-300"><span className="text-[#fbbf24] font-bold">✓</span> Auto-sync trades to journal</li>
                                <li className="flex items-center gap-3 text-gray-300"><span className="text-[#fbbf24] font-bold">✓</span> Advanced analytics (Monte Carlo)</li>
                                <li className="flex items-center gap-3 text-gray-300"><span className="text-[#fbbf24] font-bold">✓</span> Risk of Ruin calculations</li>
                                <li className="flex items-center gap-3 text-gray-300"><span className="text-[#fbbf24] font-bold">✓</span> Custom alert webhooks</li>
                                <li className="flex items-center gap-3 text-gray-300"><span className="text-[#fbbf24] font-bold">✓</span> Private Discord channel</li>
                            </ul>

                            <a href="/waitlist" className="block w-full py-4 rounded-xl font-bold text-center border border-[#fbbf24] text-[#fbbf24] hover:bg-[#fbbf24]/10 transition-all">
                                Get Elite
                            </a>
                        </div>
                    </div>

                    <div className="text-center mt-12 text-sm text-gray-500">
                        14-day money-back guarantee • Cancel anytime • Automatic refunds
                        <br />
                        <span className="text-gray-600 mt-2 block">Elite tier saves 15+ minutes per day with auto-sync. Pro tier for manual loggers.</span>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 bg-[#0a0f18]">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Trusted by <span className="text-[#00ff9d]">Systematic Traders</span>
                        </h2>
                        <p className="text-gray-400">
                            Real feedback from traders who enforce discipline.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-[#111827] p-8 rounded-2xl border border-gray-800 hover:border-[#00ff9d]/30 transition-all">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-[#00ff9d]/10 border border-[#00ff9d]/20 text-[#00ff9d] font-bold flex items-center justify-center text-xs">JM</div>
                                <div>
                                    <p className="text-white font-bold text-sm">@JordanM</p>
                                    <p className="text-gray-500 text-xs">Forex Trader • 2 years</p>
                                </div>
                            </div>
                            <p className="text-gray-300 text-sm italic mb-4 leading-relaxed">
                                &quot;The journal forced me to see I was overtrading. Went from 38% win rate to 52% just by waiting for full confluence. The system blocked my impulsive entries.&quot;
                            </p>
                            <div className="text-[#00ff9d] text-xs">★★★★★</div>
                        </div>

                        <div className="bg-[#111827] p-8 rounded-2xl border border-gray-800 hover:border-[#00ff9d]/30 transition-all">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-[#fbbf24] font-bold flex items-center justify-center text-xs">DK</div>
                                <div>
                                    <p className="text-white font-bold text-sm">@DrK_Trading</p>
                                    <p className="text-gray-500 text-xs">Prop Fiirm Trader</p>
                                </div>
                            </div>
                            <p className="text-gray-300 text-sm italic mb-4 leading-relaxed">
                                &quot;Volume confirmation saved me from 4 losing trades this week. The consolidation blocker is worth the subscription alone. No more choppy market losses.&quot;
                            </p>
                            <div className="text-[#00ff9d] text-xs">★★★★★</div>
                        </div>

                        <div className="bg-[#111827] p-8 rounded-2xl border border-gray-800 hover:border-[#00ff9d]/30 transition-all">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-[#00ff9d]/10 border border-[#00ff9d]/20 text-[#00ff9d] font-bold flex items-center justify-center text-xs">AL</div>
                                <div>
                                    <p className="text-white font-bold text-sm">@AlphaLogic</p>
                                    <p className="text-gray-500 text-xs">Gold Day Trader</p>
                                </div>
                            </div>
                            <p className="text-gray-300 text-sm italic mb-4 leading-relaxed">
                                &quot;Finally a system that doesn&apos;t repaint. ORB lines stay put, alerts only fire with full confluence. The mechanical approach removed all my emotional trading.&quot;
                            </p>
                            <div className="text-[#00ff9d] text-xs">★★★★★</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-[#0d121c] border-t border-gray-800">
                <div className="container mx-auto px-6 max-w-3xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Common <span className="text-[#00ff9d]">Questions</span>
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <details className="bg-[#111827] rounded-xl border border-gray-800 overflow-hidden group">
                            <summary className="px-6 py-5 cursor-pointer flex items-center justify-between text-white font-bold hover:text-[#00ff9d] transition-colors list-none">
                                <span>Is the Risk Calculator really free forever?</span>
                                <span className="text-[#00ff9d] group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-gray-800 pt-4">
                                <p className="mb-3"><strong className="text-white">Yes.</strong> The Risk Calculator is completely free — no account, no credit card, no limits. Open it and start sizing trades immediately.</p>
                                <p>The indicator (ORB lines, alerts, trend filters) requires a paid subscription.</p>
                            </div>
                        </details>

                        <details className="bg-[#111827] rounded-xl border border-gray-800 overflow-hidden group">
                            <summary className="px-6 py-5 cursor-pointer flex items-center justify-between text-white font-bold hover:text-[#00ff9d] transition-colors list-none">
                                <span>What&apos;s the actual methodology here?</span>
                                <span className="text-[#00ff9d] group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-gray-800 pt-4">
                                <p className="mb-3"><strong className="text-white">This is NOT ICT/SMC.</strong> This is professional day trading combining:</p>
                                <ul className="list-disc ml-5 space-y-1 mb-3">
                                    <li>Opening Range Breakout (Toby Crabel, 1990)</li>
                                    <li>Trend Following (EMA/SMA alignment, Larry Williams)</li>
                                    <li>Volume Confirmation (Wyckoff principles, 1920s)</li>
                                    <li>Pivot-Based Support/Resistance (Standard TA)</li>
                                </ul>
                                <p>These strategies have 40+ year track records. The system systematizes their application.</p>
                            </div>
                        </details>

                        <details className="bg-[#111827] rounded-xl border border-gray-800 overflow-hidden group">
                            <summary className="px-6 py-5 cursor-pointer flex items-center justify-between text-white font-bold hover:text-[#00ff9d] transition-colors list-none">
                                <span>Pro vs Elite: Which should I choose?</span>
                                <span className="text-[#00ff9d] group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-gray-800 pt-4">
                                <p className="mb-2"><strong className="text-white">Pro ($99/mo):</strong> Best for manual traders. Includes full TradingView system and community.</p>
                                <p className="mb-2"><strong className="text-white">Elite ($149/mo):</strong> Adds MT4/MT5 versions and <strong className="text-[#00ff9d]">Auto-Sync</strong> (saves 15+ min/day logging trades).</p>
                                <p>Recommendation: Start with Pro, upgrade if you need auto-sync.</p>
                            </div>
                        </details>

                        <details className="bg-[#111827] rounded-xl border border-gray-800 overflow-hidden group">
                            <summary className="px-6 py-5 cursor-pointer flex items-center justify-between text-white font-bold hover:text-[#00ff9d] transition-colors list-none">
                                <span>Will this work on stocks/crypto/forex?</span>
                                <span className="text-[#00ff9d] group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-gray-800 pt-4">
                                <p className="mb-2"><strong className="text-white">Optimized for:</strong> Forex Majors (EURUSD, GBPUSD) and Gold (XAUUSD) during active sessions.</p>
                                <p className="mb-2"><strong className="text-white">Works on:</strong> Crypto and Futures (ES, NQ) with adjusted settings.</p>
                                <p><strong className="text-white">Not recommended for:</strong> Individual stocks due to gap risk and market structure differences.</p>
                            </div>
                        </details>

                        <details className="bg-[#111827] rounded-xl border border-gray-800 overflow-hidden group">
                            <summary className="px-6 py-5 cursor-pointer flex items-center justify-between text-white font-bold hover:text-[#00ff9d] transition-colors list-none">
                                <span>I&apos;m a beginner—is this for me?</span>
                                <span className="text-[#00ff9d] group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-gray-800 pt-4">
                                <p className="mb-2"><strong className="text-white">Probably not yet.</strong> This system assumes you know basic TA and risk management. If you have 0-3 months experience, focus on free education first.</p>
                                <p>If you have 6+ months experience and struggle with discipline/overtrading, then yes, this is exactly for you.</p>
                            </div>
                        </details>

                        <details className="bg-[#111827] rounded-xl border border-gray-800 overflow-hidden group">
                            <summary className="px-6 py-5 cursor-pointer flex items-center justify-between text-white font-bold hover:text-[#00ff9d] transition-colors list-none">
                                <span>Does this give me &quot;buy/sell signals&quot;?</span>
                                <span className="text-[#00ff9d] group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-gray-800 pt-4">
                                <p className="mb-2"><strong className="text-white">Yes and no.</strong> It alerts you when high-probability conditions align (permission to trade), but YOU make the final decision.</p>
                                <p>It gives you permission, not orders. You are still the pilot; the system is your pre-flight checklist.</p>
                            </div>
                        </details>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-[#05080f] border-t border-gray-900 text-center text-gray-600 text-sm">
                <div className="container mx-auto px-6">
                    <p className="mb-2">&copy; {new Date().getFullYear()} RetailBeastFX. All rights reserved.</p>
                    <p className="text-xs text-gray-700">Built on proven methodologies: Crabel ORB (1990) • Williams Trend Following • Wyckoff Volume Analysis (1920s)</p>
                </div>
            </footer>
        </div>
    );
}
