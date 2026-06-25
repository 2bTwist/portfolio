/* Claude burst = the REAL Claude mark (single brand path), drawn 12 times, each
   copy clipped to one angular wedge so every visible spoke is an exact slice of
   the real logo — no redrawing. Each wedge scales about the burst centre on a
   staggered delay, so on hover the real spokes retract and extend as a breathing
   wave (see .claude-spoke in globals.css). No rotation. */

import type { CSSProperties } from "react";

const MARK_D =
  "m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z";

export function ClaudeBurst({ color, className = "" }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`stack-tile-logo stack-tile-logo--claude ${className}`} fill={color} aria-hidden="true">
      <defs>
        <path id="claude-mark" d={MARK_D} />
        <clipPath id="cs-0"><polygon points="12,12 71.94,14.62 70.40,-1.75 64.48,-17.09" /></clipPath>
        <clipPath id="cs-1"><polygon points="12,12 64.48,-17.09 53.11,-31.70 37.83,-42.16" /></clipPath>
        <clipPath id="cs-2"><polygon points="12,12 37.83,-42.16 21.13,-47.30 3.65,-47.42" /></clipPath>
        <clipPath id="cs-3"><polygon points="12,12 3.65,-47.42 -12.88,-42.60 -27.36,-33.28" /></clipPath>
        <clipPath id="cs-4"><polygon points="12,12 -27.36,-33.28 -38.18,-20.90 -45.22,-6.04" /></clipPath>
        <clipPath id="cs-5"><polygon points="12,12 -45.22,-6.04 -47.99,11.21 -45.68,28.54" /></clipPath>
        <clipPath id="cs-6"><polygon points="12,12 -45.68,28.54 -39.83,42.23 -30.80,54.05" /></clipPath>
        <clipPath id="cs-7"><polygon points="12,12 -30.80,54.05 -19.80,62.88 -7.04,68.90" /></clipPath>
        <clipPath id="cs-8"><polygon points="12,12 -7.04,68.90 10.17,71.97 27.53,69.96" /></clipPath>
        <clipPath id="cs-9"><polygon points="12,12 27.53,69.96 39.94,65.10 50.97,57.62" /></clipPath>
        <clipPath id="cs-10"><polygon points="12,12 50.97,57.62 58.79,49.56 64.98,40.17" /></clipPath>
        <clipPath id="cs-11"><polygon points="12,12 64.98,40.17 69.89,27.78 71.94,14.62" /></clipPath>
      </defs>
      <g className="claude-spoke" style={{ "--sd": "0.000s" } as CSSProperties} clipPath="url(#cs-0)">
        <use href="#claude-mark" />
      </g>
      <g className="claude-spoke" style={{ "--sd": "-0.104s" } as CSSProperties} clipPath="url(#cs-1)">
        <use href="#claude-mark" />
      </g>
      <g className="claude-spoke" style={{ "--sd": "-0.208s" } as CSSProperties} clipPath="url(#cs-2)">
        <use href="#claude-mark" />
      </g>
      <g className="claude-spoke" style={{ "--sd": "-0.313s" } as CSSProperties} clipPath="url(#cs-3)">
        <use href="#claude-mark" />
      </g>
      <g className="claude-spoke" style={{ "--sd": "-0.417s" } as CSSProperties} clipPath="url(#cs-4)">
        <use href="#claude-mark" />
      </g>
      <g className="claude-spoke" style={{ "--sd": "-0.521s" } as CSSProperties} clipPath="url(#cs-5)">
        <use href="#claude-mark" />
      </g>
      <g className="claude-spoke" style={{ "--sd": "-0.625s" } as CSSProperties} clipPath="url(#cs-6)">
        <use href="#claude-mark" />
      </g>
      <g className="claude-spoke" style={{ "--sd": "-0.729s" } as CSSProperties} clipPath="url(#cs-7)">
        <use href="#claude-mark" />
      </g>
      <g className="claude-spoke" style={{ "--sd": "-0.833s" } as CSSProperties} clipPath="url(#cs-8)">
        <use href="#claude-mark" />
      </g>
      <g className="claude-spoke" style={{ "--sd": "-0.938s" } as CSSProperties} clipPath="url(#cs-9)">
        <use href="#claude-mark" />
      </g>
      <g className="claude-spoke" style={{ "--sd": "-1.042s" } as CSSProperties} clipPath="url(#cs-10)">
        <use href="#claude-mark" />
      </g>
      <g className="claude-spoke" style={{ "--sd": "-1.146s" } as CSSProperties} clipPath="url(#cs-11)">
        <use href="#claude-mark" />
      </g>
    </svg>
  );
}
