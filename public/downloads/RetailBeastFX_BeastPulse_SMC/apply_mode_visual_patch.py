#!/usr/bin/env python3
"""
Apply BeastPulse SMC mode-aware visual display patch to a Pine script.
Usage: python apply_mode_visual_patch.py < input.pine > output.pine
   or: python apply_mode_visual_patch.py input.pine -o output.pine
"""
import sys
import re

def main():
    if len(sys.argv) >= 2 and sys.argv[1] != "-":
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            text = f.read()
        # Output: -o out.pine (4 args) or single output path (3 args) or default _patched.pine (2 args)
        if len(sys.argv) >= 4 and sys.argv[2] == "-o":
            out_path = sys.argv[3]
        elif len(sys.argv) >= 3:
            out_path = sys.argv[2]
        else:
            out_path = sys.argv[1].replace(".pine", "_patched.pine")
    else:
        text = sys.stdin.read()
        out_path = None

    # 1. Add mode visibility flags after finalMinScoreSMC
    anchor = 'int finalMinScoreSMC = mode == "SMC" ? 4 : (mode == "Custom" ? minPatternScoreSMC : 4)'
    insertion = '''int finalMinScoreSMC = mode == "SMC" ? 4 : (mode == "Custom" ? minPatternScoreSMC : 4)

// Mode-aware visual flags (hide irrelevant concepts per mode)
bool showSMCVisuals = (mode == "SMC" or mode == "Custom")
bool showORBVisuals = orbEnabled'''
    if anchor in text and "bool showSMCVisuals" not in text:
        text = text.replace(anchor, insertion, 1)

    # 2. Gate OB box
    text = text.replace("if smcVisuals and showInstZones", "if showSMCVisuals and smcVisuals and showInstZones")

    # 3. Gate FVG box colors (bull) – allow newline between border_color and bgcolor
    text = re.sub(
        r"border_color=color\.new\(#00BFA5,\s*60\)\s*,\s*bgcolor=color\.new\(#00BFA5,\s*93\)",
        "border_color=showSMCVisuals ? color.new(#00BFA5, 60) : color.new(color.gray, 100), bgcolor=showSMCVisuals ? color.new(#00BFA5, 93) : color.new(color.gray, 100)",
        text,
    )
    # 3b. Bear FVG
    text = re.sub(
        r"border_color=color\.new\(#FF5252,\s*60\)\s*,\s*bgcolor=color\.new\(#FF5252,\s*93\)",
        "border_color=showSMCVisuals ? color.new(#FF5252, 60) : color.new(color.gray, 100), bgcolor=showSMCVisuals ? color.new(#FF5252, 93) : color.new(color.gray, 100)",
        text,
    )

    # 4. Gate SMC confluence labels
    text = text.replace("if requireSMC and smcLongOk and not minimalSMCLabels", "if showSMCVisuals and requireSMC and smcLongOk and not minimalSMCLabels")
    text = text.replace("if requireSMC and smcShortOk and not minimalSMCLabels", "if showSMCVisuals and requireSMC and smcShortOk and not minimalSMCLabels")
    text = text.replace("if requireSMC and longSignalBase and not longSignal", "if showSMCVisuals and requireSMC and longSignalBase and not longSignal")
    text = text.replace("if requireSMC and shortSignalBase and not shortSignal", "if showSMCVisuals and requireSMC and shortSignalBase and not shortSignal")

    # 5. Gate ORB box/lines
    text = text.replace(
        "if orbComplete and not inORB and inORB[1] and showORBLines and orbEnabled and canDrawORB",
        "if orbComplete and not inORB and inORB[1] and showORBLines and showORBVisuals and canDrawORB"
    )
    text = text.replace(
        "if orbComplete and not na(orbHighLine) and showORBLines",
        "if orbComplete and not na(orbHighLine) and showORBLines and showORBVisuals"
    )

    # 6. Gate ORB retest labels
    text = text.replace("if orbRetestLong and showSignals", "if orbRetestLong and showSignals and showORBVisuals")
    text = text.replace("if orbRetestShort and showSignals", "if orbRetestShort and showSignals and showORBVisuals")

    # 7. Gate Rails
    text = text.replace(
        "if not inRailSession and inRailSession[1] and rDone and showRails",
        "if not inRailSession and inRailSession[1] and rDone and showRails and showORBVisuals"
    )

    if out_path:
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(text)
        print("Written:", out_path, file=sys.stderr)
    else:
        sys.stdout.write(text)

if __name__ == "__main__":
    main()
