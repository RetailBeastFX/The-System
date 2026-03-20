# BeastPulse SMC – Mode-Aware Visual Display Patch

Apply these edits to your BeastPulse SMC Pine script so visuals are gated by mode.

## 1. Add mode visibility flags

**Location:** Right after the line  
`int finalMinScoreSMC = mode == "SMC" ? 4 : (mode == "Custom" ? minPatternScoreSMC : 4)`

**Add:**
```pine
// Mode-aware visual flags (hide irrelevant concepts per mode)
bool showSMCVisuals = (mode == "SMC" or mode == "Custom")
bool showORBVisuals = orbEnabled
```

## 2. Gate OB box rendering

**Find:**  
`if smcVisuals and showInstZones`

**Replace with:**  
`if showSMCVisuals and smcVisuals and showInstZones`

## 3. Gate FVG box rendering

**Bull FVG box.new** – find the block that creates the bull FVG box (e.g. after `if validBullFVG`) and set colors by mode:

- `border_color=color.new(#00BFA5, 60)` → `border_color=showSMCVisuals ? color.new(#00BFA5, 60) : color.new(color.gray, 100)`
- `bgcolor=color.new(#00BFA5, 93)` → `bgcolor=showSMCVisuals ? color.new(#00BFA5, 93) : color.new(color.gray, 100)`

**Bear FVG box.new** – same idea:

- `border_color=color.new(#FF5252, 60)` → `border_color=showSMCVisuals ? color.new(#FF5252, 60) : color.new(color.gray, 100)`
- `bgcolor=color.new(#FF5252, 93)` → `bgcolor=showSMCVisuals ? color.new(#FF5252, 93) : color.new(color.gray, 100)`

## 4. Gate SMC confluence labels

**"SMC ✓" long:**  
`if requireSMC and smcLongOk and not minimalSMCLabels`  
→ `if showSMCVisuals and requireSMC and smcLongOk and not minimalSMCLabels`

**"SMC ✓" short:**  
`if requireSMC and smcShortOk and not minimalSMCLabels`  
→ `if showSMCVisuals and requireSMC and smcShortOk and not minimalSMCLabels`

**"SMC missing" long:**  
`if requireSMC and longSignalBase and not longSignal`  
→ `if showSMCVisuals and requireSMC and longSignalBase and not longSignal`

**"SMC missing" short:**  
`if requireSMC and shortSignalBase and not shortSignal`  
→ `if showSMCVisuals and requireSMC and shortSignalBase and not shortSignal`

## 5. Gate ORB range/breakout lines

**ORB box and lines creation:**  
`if orbComplete and not inORB and inORB[1] and showORBLines and orbEnabled and canDrawORB`  
→ `if orbComplete and not inORB and inORB[1] and showORBLines and showORBVisuals and canDrawORB`

**ORB line extension:**  
`if orbComplete and not na(orbHighLine) and showORBLines`  
→ `if orbComplete and not na(orbHighLine) and showORBLines and showORBVisuals`

## 6. Gate ORB retest labels

**Long:**  
`if orbRetestLong and showSignals`  
→ `if orbRetestLong and showSignals and showORBVisuals`

**Short:**  
`if orbRetestShort and showSignals`  
→ `if orbRetestShort and showSignals and showORBVisuals`

## 7. Gate Antigravity Rails (optional, ORB-related)

**Rails drawing:**  
`if not inRailSession and inRailSession[1] and rDone and showRails`  
→ `if not inRailSession and inRailSession[1] and rDone and showRails and showORBVisuals`

## 8. Keep always visible

- MAs (Fast/Slow), ribbon, background: no change (always visible).
- Entry signal labels (LONG/SHORT, type): no change (always visible).
- Dashboard: no change (always visible).

## Verification

After applying the patch, compile the script in TradingView (Pine Editor) and confirm:

- **SMC/Custom:** OBs, FVGs, and SMC confluence labels show; ORB box/lines and ORB retest labels hidden when ORB is off.
- **Standard/ORB:** ORB box, lines, retest labels (and rails if gated) show; SMC-style OB/FVG/confluence visuals hidden unless Custom with SMC on.
- MAs, signals, and dashboard are always visible.
