#!/usr/bin/env python3
"""Consult the Bones (Tales of Argosa p.212).

Dice (face layout from the official dddice set linked in the book):
  Hammer of Judgment  d6: 3 Yes, 3 No
  Twins of Fate (x2)  d6: 2 Yes, 2 No, 2 Nil
  Fortune             d6: 2 Fortune (sun), 2 Misfortune (skull), 2 Nil

Usage: bones.py [even|likely-yes|likely-no]
"""
import secrets, sys, json

R = secrets.SystemRandom()
JUDGMENT = ["Yes"] * 3 + ["No"] * 3
FATE     = ["Yes"] * 2 + ["No"] * 2 + ["Nil"] * 2
FORTUNE  = ["Fortune"] * 2 + ["Misfortune"] * 2 + ["Nil"] * 2

def cast():
    return {"judgment": R.choice(JUDGMENT),
            "fate": [R.choice(FATE), R.choice(FATE)],
            "fortune": R.choice(FORTUNE)}

def resolve(d):
    j, (f1, f2) = d["judgment"], d["fate"]
    yes = [j, f1, f2].count("Yes")
    no = [j, f1, f2].count("No")
    if yes == no:
        # Only possible as Judgment vs one opposite Twin (other Twin blank):
        # Judgment is the tie breaker and the Fate die is ignored.
        answer, strength = j, 1
        note = "Judgment breaks the tie and trumps the Fate die"
    else:
        answer = "Yes" if yes > no else "No"
        strength = abs(yes - no)
        note = f"{yes} Yes vs {no} No, cancelling to {strength} {answer}"
    label = {1: answer, 2: f"Double {answer} (greater)", 3: f"Triple {answer} (extremely great)"}[strength]
    return {"answer": answer, "strength": strength, "label": label, "note": note,
            "fortune": d["fortune"]}

def consult(likelihood="even"):
    first = cast()
    final = json.loads(json.dumps(first))
    reroll = None
    unlikely = {"likely-yes": "No", "likely-no": "Yes"}.get(likelihood)
    if unlikely:
        if final["judgment"] == unlikely:          # must reroll Judgment if it's a candidate
            old = final["judgment"]; final["judgment"] = R.choice(JUDGMENT)
            reroll = f"Judgment showed the unlikely {old}; rerolled to {final['judgment']}"
        elif unlikely in final["fate"]:
            k = final["fate"].index(unlikely); old = final["fate"][k]
            final["fate"][k] = R.choice(FATE)
            reroll = f"A Fate die showed the unlikely {old}; rerolled to {final['fate'][k]}"
    return {"likelihood": likelihood, "cast": first, "reroll": reroll,
            "final_dice": final, "result": resolve(final)}

if __name__ == "__main__":
    print(json.dumps(consult(sys.argv[1] if len(sys.argv) > 1 else "even"), indent=1))
