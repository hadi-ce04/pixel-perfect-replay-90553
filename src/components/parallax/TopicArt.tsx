import type { TopicId } from "@/lib/types";

/** Original geometric editorial illustrations. These do not depict source footage. */
export function TopicArt({
  topic,
  className = "",
  tone = 0,
}: {
  topic: TopicId | "open";
  className?: string;
  tone?: number;
}) {
  if (topic === "open") return <OpenArt className={className} tone={tone} />;
  const housing = topic === "housing";
  return (
    <svg
      viewBox="0 0 400 480"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect
        width="400"
        height="480"
        fill={
          housing
            ? "#ec7853"
            : topic === "transport"
              ? "#a9bbc0"
              : topic === "groceries"
                ? "#c6c9a6"
                : topic === "employment"
                  ? "#b3a99a"
                  : "#8ea696"
        }
      />
      {housing ? (
        <>
          <circle cx="305" cy="93" r="60" fill="#f2c4a8" />
          <path d="M-40 500V150L115 83v417M115 83l130 85v332H115" fill="#26343a" />
          <path d="M245 168l140-70 55 34v368H245" fill="#e8d4bd" />
          <path d="M385 98v402h55V132" fill="#bba68f" />
          {[0, 1, 2, 3, 4].map((row) => (
            <g key={row}>
              {[0, 1, 2].map((col) => (
                <g key={col}>
                  <path
                    d={`M${-2 + col * 37} ${174 + row * 63}l21-8v35l-21 8z`}
                    fill={row === 2 && col === 1 ? "#ffb973" : "#a3aeb0"}
                  />
                  <path
                    d={`M${140 + col * 32} ${196 + row * 57}l17 10v27l-17-10z`}
                    fill="#52646b"
                  />
                  <path d={`M${269 + col * 35} ${191 + row * 57}l18-9v31l-18 9z`} fill="#46565b" />
                </g>
              ))}
            </g>
          ))}
          <path d="M0 432l245 48h155v-52l-155-16z" fill="#1a2429" />
          <path d="M286 480v-74h32v74" fill="#e9a56a" />
        </>
      ) : topic === "transport" ? (
        <>
          <path d="M0 365L400 90v390H0" fill="#3c5059" />
          <path d="M0 390L400 110M0 430l400-275M0 470l400-275" stroke="#d5e0dc" strokeWidth="4" />
          <path d="M65 303V150q0-40 45-40h180q45 0 45 40v153z" fill="#e5d6b5" />
          <path d="M80 160h240v94H80z" fill="#22353c" />
          <path d="M88 172h70v69H88M171 172h60v69h-60M244 172h65v69h-65" fill="#8ea4aa" />
          <rect x="65" y="270" width="270" height="30" fill="#e7784e" />
          <circle cx="115" cy="315" r="24" fill="#19262b" />
          <circle cx="287" cy="315" r="24" fill="#19262b" />
          <path d="M0 70h400M0 88h400" stroke="#3c5059" strokeWidth="2" />
        </>
      ) : topic === "groceries" ? (
        <>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path key={i} d={`M0 ${i * 80}h400M${i * 80} 0v480`} stroke="#a1aa89" strokeWidth="1" />
          ))}
          <path d="M85 252h230l-22 171H107z" fill="#e8dbc0" />
          <path
            d="M120 252v-85q0-66 80-66t80 66v85"
            stroke="#314940"
            strokeWidth="18"
            fill="none"
          />
          <path d="M142 283l-17-103 30-17 39 120M244 283l48-144 27 12-38 132" fill="#cc794a" />
          <ellipse cx="218" cy="247" rx="57" ry="68" fill="#5b7050" />
          <path d="M85 300h230v123H107z" fill="#d3bf9c" />
          <path d="M135 337h122M135 351h78M135 365h103" stroke="#314940" strokeWidth="5" />
        </>
      ) : topic === "employment" ? (
        <>
          <path d="M0 385l400-96v191H0" fill="#34434a" />
          <path d="M83 123l210 25-20 224-210-25z" fill="#e5dccc" />
          <path
            d="M116 163l130 16M112 192l130 16M108 221l98 12M104 250l130 16"
            stroke="#7e8c88"
            strokeWidth="7"
          />
          <rect x="156" y="291" width="151" height="88" rx="9" fill="#c66845" />
          <path d="M204 291v-23h58v23" stroke="#25343a" strokeWidth="9" fill="none" />
          <path d="M167 319h129" stroke="#e9b080" strokeWidth="3" />
        </>
      ) : (
        <>
          <circle cx="295" cy="112" r="63" fill="#e2c895" />
          <path d="M0 390Q130 162 270 340T480 332v148H0" fill="#3f5e54" />
          <path d="M-20 440Q180 242 440 428v52H0" fill="#233f38" />
          <path
            d="M207 420V156M207 288q-100-7-90-104 90 3 90 104M207 237q100-7 90-104-90 3-90 104"
            fill="#aac0a2"
            stroke="#253f37"
            strokeWidth="5"
          />
        </>
      )}
      <path
        d="M15 15h20M15 15v20M385 15h-20M385 15v20M15 465h20M15 465v-20M385 465h-20M385 465v-20"
        stroke="#fff"
        strokeOpacity=".4"
        fill="none"
      />
    </svg>
  );
}

const OPEN_TONES = ["#a9bbc0", "#c6c9a6", "#b3a99a", "#8ea696"];

/** Neutral composition for open-ended live questions. It suggests no subject or footage. */
function OpenArt({ className, tone }: { className: string; tone: number }) {
  const bg = OPEN_TONES[tone % OPEN_TONES.length]!;
  const shift = (tone % 4) * 40;
  return (
    <svg
      viewBox="0 0 400 480"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width="400" height="480" fill={bg} />
      <rect x={40 + shift} y="70" width="150" height="340" fill="#26343a" />
      <rect x={210 - shift / 2} y="150" width="150" height="260" fill="#e8d4bd" />
      <circle cx={290 - shift / 2} cy="110" r="46" fill="#ec7853" />
      <path d={`M0 410H400`} stroke="#26343a" strokeWidth="6" />
    </svg>
  );
}
