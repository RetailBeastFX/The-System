# BeastPulse SMC – Mode-Aware Visual Display

## What this does

- **`showSMCVisuals`** = `true` in **SMC** and **Custom** modes → OBs, FVGs, and SMC confluence labels are shown.
- **`showORBVisuals`** = `orbEnabled` → ORB range/breakout lines and ORB retest labels (and Rails) only show when ORB is enabled.
- **MAs, signals, and dashboard** are never gated (always visible).

## How to apply the patch

1. **Save your full BeastPulse SMC script** (the one with `strategy("RetailBeastFX – BeastPulse SMC", ...)`) to a file, e.g. `BeastPulse_SMC_base.pine` in this folder.

2. **Run the patch script** (from this folder):
   ```bash
   python apply_mode_visual_patch.py BeastPulse_SMC_base.pine BeastPulse_SMC.pine
   ```
   Or with `-o`:
   ```bash
   python apply_mode_visual_patch.py BeastPulse_SMC_base.pine -o BeastPulse_SMC.pine
   ```
   Or from stdin: `python apply_mode_visual_patch.py < BeastPulse_SMC_base.pine > BeastPulse_SMC.pine`

3. **Open `BeastPulse_SMC.pine`** in TradingView (Pine Editor) and **compile** to verify.

## Manual alternative

See **`MODE_VISUAL_PATCH.md`** for exact find/replace steps to apply the same changes by hand.

## Verification

- **SMC or Custom:** OB boxes, FVG boxes, and SMC confluence labels visible when SMC visuals are on; ORB lines/labels hidden when ORB is off.
- **Standard or ORB:** ORB box, high/low lines, retest labels (and Rails) visible when ORB is on; SMC-style OB/FVG/confluence only in Custom with SMC on.
- **MAs, entry labels, dashboard:** always visible in all modes.
