import React from 'react';

const InkDots: React.FC<{id: string}> = ({id}) => (
  <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse">
    <circle cx="2" cy="2" r="1.2" fill="#211a14" opacity=".2" />
    <circle cx="8" cy="6" r=".8" fill="#211a14" opacity=".12" />
  </pattern>
);

export const CityCutout: React.FC = () => (
  <svg width="790" height="980" viewBox="0 0 790 980">
    <defs>
      <InkDots id="cityDots" />
      <linearGradient id="cityPaper" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#eee5ce" />
        <stop offset="1" stopColor="#d5c39c" />
      </linearGradient>
      <filter id="cityRough">
        <feTurbulence baseFrequency=".025" numOctaves="2" seed="7" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" />
      </filter>
      <clipPath id="cityClip">
        <path d="M22 34 L748 9 781 88 760 944 55 970 10 887 31 682 8 514 26 282 Z" />
      </clipPath>
    </defs>
    <path
      d="M22 34 L748 9 781 88 760 944 55 970 10 887 31 682 8 514 26 282 Z"
      fill="url(#cityPaper)"
      stroke="#352a20"
      strokeWidth="5"
      filter="url(#cityRough)"
    />
    <g clipPath="url(#cityClip)">
      <rect x="0" y="0" width="790" height="980" fill="url(#cityDots)" />
      <rect x="0" y="0" width="790" height="420" fill="#b8c3bc" opacity=".55" />
      <path d="M0 680 C170 620 360 650 790 560 L790 980 0 980Z" fill="#4f5d5d" opacity=".68" />
      <path d="M0 700 C240 650 500 735 790 625" fill="none" stroke="#e9ddbf" strokeWidth="16" opacity=".45" />

      <g fill="#2b2924" stroke="#181612" strokeWidth="4">
        <path d="M86 626 V430 L130 399 172 428 V626Z" />
        <path d="M171 626 V360 L219 316 267 361 V626Z" />
        <path d="M266 626 V438 L309 405 352 438 V626Z" />
        <path d="M350 626 V397 L400 352 449 398 V626Z" />
        <path d="M448 626 V451 L493 413 538 452 V626Z" />
        <path d="M537 626 V383 L587 337 637 384 V626Z" />
        <path d="M636 626 V430 L682 391 728 430 V626Z" />
      </g>
      <g fill="#d8c89f" stroke="#242019" strokeWidth="4">
        <path d="M70 632 V604 H744 V632Z" />
        <path d="M93 604 V565 H137 V604Z" />
        <path d="M183 604 V548 H228 V604Z" />
        <path d="M278 604 V559 H322 V604Z" />
        <path d="M373 604 V541 H418 V604Z" />
        <path d="M470 604 V557 H515 V604Z" />
        <path d="M566 604 V546 H611 V604Z" />
        <path d="M658 604 V557 H706 V604Z" />
      </g>

      <g transform="translate(285 214)" stroke="#201c17" strokeWidth="6" fill="#e1d2ad">
        <path d="M30 330 V168 H248 V330Z" />
        <path d="M71 168 C72 72 208 72 208 168Z" />
        <path d="M87 168 C91 92 189 92 193 168Z" fill="#2c2a25" />
        <path d="M15 330 H265" />
        <rect x="6" y="113" width="21" height="217" fill="#2c2a25" />
        <path d="M16 113 L5 78 16 38 27 78Z" fill="#2c2a25" />
        <rect x="252" y="101" width="21" height="229" fill="#2c2a25" />
        <path d="M262 101 L251 65 262 25 273 65Z" fill="#2c2a25" />
      </g>

      <g stroke="#2c2720" strokeWidth="5" fill="#d8c89f">
        <path d="M74 720 Q110 678 146 720 V783 H74Z" />
        <path d="M198 752 Q240 702 282 752 V810 H198Z" />
        <path d="M506 736 Q552 680 598 736 V800 H506Z" />
        <path d="M632 760 Q675 708 718 760 V817 H632Z" />
      </g>

      <g transform="translate(52 774)" fill="#161713" stroke="#e5d7b6" strokeWidth="3">
        <path d="M0 60 C45 11 106 11 152 60 C105 76 46 76 0 60Z" />
        <rect x="61" y="12" width="9" height="50" />
        <path d="M65 14 L22 41 65 39Z" fill="#e5d7b6" />
        <path d="M65 16 L119 43 65 40Z" fill="#d8c8a5" />
      </g>
      <g transform="translate(555 830) scale(.82)" fill="#161713" stroke="#e5d7b6" strokeWidth="3">
        <path d="M0 60 C45 11 106 11 152 60 C105 76 46 76 0 60Z" />
        <rect x="61" y="12" width="9" height="50" />
        <path d="M65 14 L22 41 65 39Z" fill="#e5d7b6" />
      </g>
    </g>
  </svg>
);

export const MehmedPortrait: React.FC = () => (
  <svg width="600" height="790" viewBox="0 0 600 790">
    <defs>
      <InkDots id="mehmedDots" />
      <clipPath id="mehmedPaper">
        <path d="M33 54 L535 11 583 86 558 747 92 779 17 703 40 505 9 314Z" />
      </clipPath>
      <filter id="mehmedRough">
        <feTurbulence baseFrequency=".035" numOctaves="2" seed="9" result="t" />
        <feDisplacementMap in="SourceGraphic" in2="t" scale="2.2" />
      </filter>
    </defs>
    <path
      d="M33 54 L535 11 583 86 558 747 92 779 17 703 40 505 9 314Z"
      fill="#e6d9b9"
      stroke="#2a211a"
      strokeWidth="5"
      filter="url(#mehmedRough)"
    />
    <g clipPath="url(#mehmedPaper)">
      <rect width="600" height="790" fill="url(#mehmedDots)" />
      <ellipse cx="302" cy="650" rx="234" ry="185" fill="#302921" />
      <path d="M201 540 Q155 618 123 760 H495 Q465 627 404 540Z" fill="#4c2c27" stroke="#211813" strokeWidth="6" />
      <path d="M239 511 Q195 567 202 657 L303 692 398 650 Q403 565 365 509Z" fill="#d2bb8f" stroke="#2a211a" strokeWidth="6" />
      <path d="M242 227 Q170 303 201 437 Q218 522 304 548 Q389 523 411 424 Q432 305 364 231Z" fill="#c4a276" stroke="#211b16" strokeWidth="7" />
      <path d="M212 351 Q246 337 277 350" fill="none" stroke="#211b16" strokeWidth="9" strokeLinecap="round" />
      <path d="M330 349 Q367 336 394 352" fill="none" stroke="#211b16" strokeWidth="9" strokeLinecap="round" />
      <path d="M249 374 Q262 382 274 374" fill="none" stroke="#211b16" strokeWidth="7" />
      <path d="M339 374 Q351 382 364 374" fill="none" stroke="#211b16" strokeWidth="7" />
      <path d="M307 368 Q288 418 309 425" fill="none" stroke="#4d3425" strokeWidth="6" />
      <path d="M268 456 Q306 478 345 453" fill="none" stroke="#3a211a" strokeWidth="8" strokeLinecap="round" />
      <path d="M245 435 Q309 464 371 429 Q364 493 306 516 Q253 494 245 435Z" fill="#3a221b" />
      <path d="M192 268 Q194 202 254 174 Q329 139 399 184 Q441 210 428 282 Q392 247 343 246 Q270 251 192 268Z" fill="#211b16" />
      <g fill="#eee2c5" stroke="#2b2119" strokeWidth="6">
        <path d="M158 261 Q176 154 298 137 Q424 126 456 246 Q407 221 347 222 Q254 225 158 261Z" />
        <path d="M182 199 Q222 92 324 104 Q421 117 444 211 Q355 174 182 199Z" />
        <path d="M221 143 Q307 52 401 139 Q310 111 221 143Z" />
      </g>
      <path d="M194 280 Q165 346 184 410" fill="none" stroke="#8d2a23" strokeWidth="10" opacity=".8" />
      <path d="M419 274 Q449 346 428 415" fill="none" stroke="#8d2a23" strokeWidth="10" opacity=".8" />
      <rect x="42" y="42" width="516" height="706" fill="none" stroke="#9c3027" strokeWidth="5" opacity=".45" />
    </g>
  </svg>
);

export const CannonCutout: React.FC = () => (
  <svg width="820" height="430" viewBox="0 0 820 430">
    <defs>
      <InkDots id="cannonDots" />
      <filter id="cannonRough">
        <feTurbulence baseFrequency=".04" numOctaves="2" seed="4" result="t" />
        <feDisplacementMap in="SourceGraphic" in2="t" scale="1.8" />
      </filter>
    </defs>
    <path d="M18 69 L734 12 807 97 773 382 66 416 9 342Z" fill="#ded1b2" stroke="#2a221c" strokeWidth="5" filter="url(#cannonRough)" />
    <rect x="18" y="35" width="780" height="360" fill="url(#cannonDots)" opacity=".9" />
    <g transform="translate(60 68)" stroke="#171714" strokeWidth="8" strokeLinejoin="round">
      <path d="M142 191 L600 105 649 156 174 247Z" fill="#30312d" />
      <ellipse cx="612" cy="131" rx="50" ry="37" fill="#181a17" />
      <ellipse cx="612" cy="131" rx="30" ry="21" fill="#b19a70" />
      <path d="M139 176 L189 167 221 252 164 267Z" fill="#5d3b28" />
      <path d="M83 238 L229 218 267 296 43 316Z" fill="#70462f" />
      <circle cx="106" cy="311" r="63" fill="#2d2b25" />
      <circle cx="106" cy="311" r="37" fill="#c1a577" />
      <circle cx="245" cy="294" r="55" fill="#2d2b25" />
      <circle cx="245" cy="294" r="31" fill="#c1a577" />
      <path d="M50 318 L260 298" stroke="#8d2b23" strokeWidth="10" />
      <path d="M151 169 Q322 113 591 102" fill="none" stroke="#e1d4b4" strokeWidth="5" opacity=".5" />
    </g>
  </svg>
);

export const WallsCutout: React.FC = () => (
  <svg width="980" height="780" viewBox="0 0 980 780">
    <defs>
      <InkDots id="wallDots" />
      <linearGradient id="stone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d7c7a2" />
        <stop offset="1" stopColor="#9e825a" />
      </linearGradient>
      <clipPath id="wallClip">
        <path d="M15 42 L943 9 969 89 951 734 50 771 8 701 25 501Z" />
      </clipPath>
    </defs>
    <path d="M15 42 L943 9 969 89 951 734 50 771 8 701 25 501Z" fill="#e4d7b7" stroke="#2d251d" strokeWidth="5" />
    <g clipPath="url(#wallClip)">
      <rect width="980" height="780" fill="url(#wallDots)" />
      <rect y="160" width="980" height="620" fill="#899391" opacity=".45" />
      <path d="M0 680 C240 620 548 695 980 615 V780 H0Z" fill="#58584d" opacity=".72" />
      <g stroke="#2b251f" strokeWidth="7" fill="url(#stone)">
        <path d="M65 620 V260 H242 V620Z" />
        <path d="M260 620 V175 H465 V620Z" />
        <path d="M482 620 V286 H667 V620Z" />
        <path d="M684 620 V205 H909 V620Z" />
        <path d="M49 620 H930 V686 H49Z" />
      </g>
      <g fill="#2d2b27">
        {Array.from({length: 9}).map((_, i) => (
          <rect key={`a-${i}`} x={67 + i * 98} y={232 + (i % 2) * 45} width="40" height="44" />
        ))}
      </g>
      <g stroke="#756143" strokeWidth="3" opacity=".55">
        {Array.from({length: 11}).map((_, i) => (
          <path key={i} d={`M${45 + i * 86} 330 H${110 + i * 86} M${65 + i * 86} 440 H${132 + i * 86} M${38 + i * 86} 550 H${104 + i * 86}`} />
        ))}
      </g>
      <path d="M527 294 L561 345 535 391 576 435 545 497 590 563 559 635" fill="none" stroke="#702b23" strokeWidth="15" strokeLinecap="round" />
      <path d="M527 294 L561 345 535 391 576 435 545 497 590 563 559 635" fill="none" stroke="#e7d8b7" strokeWidth="5" strokeLinecap="round" opacity=".55" />
      <g transform="translate(95 490)" fill="#272620">
        <circle cx="0" cy="0" r="18" />
        <circle cx="55" cy="-7" r="17" />
        <circle cx="112" cy="3" r="16" />
        <path d="M-18 20 L18 20 28 105 -28 105Z" />
        <path d="M37 10 L73 10 82 102 29 102Z" />
        <path d="M96 20 L128 20 137 104 87 104Z" />
      </g>
    </g>
  </svg>
);

export const GoldenHornMap: React.FC = () => (
  <svg width="930" height="890" viewBox="0 0 930 890">
    <defs>
      <InkDots id="mapDots" />
      <filter id="mapRough">
        <feTurbulence baseFrequency=".03" numOctaves="2" seed="14" result="t" />
        <feDisplacementMap in="SourceGraphic" in2="t" scale="2.4" />
      </filter>
    </defs>
    <path d="M24 43 L866 8 916 73 892 832 72 879 10 805 28 590 7 306Z" fill="#e3d7b8" stroke="#2b241d" strokeWidth="5" filter="url(#mapRough)" />
    <rect x="20" y="24" width="880" height="835" fill="url(#mapDots)" />
    <path d="M-20 381 C200 301 334 430 521 341 C678 266 762 313 950 226" fill="none" stroke="#607879" strokeWidth="165" opacity=".83" />
    <path d="M-20 381 C200 301 334 430 521 341 C678 266 762 313 950 226" fill="none" stroke="#e5d9bb" strokeWidth="7" opacity=".55" />
    <path d="M80 590 C238 476 395 507 520 437 C659 358 727 325 854 302" fill="none" stroke="#8d3027" strokeWidth="10" strokeDasharray="18 14" strokeLinecap="round" />
    <path d="M206 325 C260 364 321 383 381 389" fill="none" stroke="#28231d" strokeWidth="15" strokeDasharray="8 7" />
    <g fill="#302a22" stroke="#e6d8b7" strokeWidth="3">
      <path d="M50 604 L214 534 273 589 110 664Z" />
      <path d="M520 585 L711 464 790 526 598 646Z" />
      <path d="M624 180 L832 94 878 154 676 239Z" />
    </g>
    <g transform="translate(687 89)" fill="#e7d9b7" stroke="#2b241d" strokeWidth="5">
      <path d="M0 110 C36 18 138 12 183 90 L165 170 21 177Z" />
      <path d="M74 94 C82 34 125 31 139 92Z" fill="#2c2924" />
      <rect x="11" y="55" width="15" height="119" fill="#2c2924" />
      <path d="M18 55 L8 27 18 2 28 27Z" fill="#2c2924" />
    </g>
  </svg>
);

export const ShipCutout: React.FC<{flip?: boolean}> = ({flip = false}) => (
  <svg width="330" height="230" viewBox="0 0 330 230" style={{transform: flip ? 'scaleX(-1)' : undefined}}>
    <defs>
      <InkDots id={flip ? 'shipDotsB' : 'shipDotsA'} />
    </defs>
    <path d="M11 31 L299 8 324 41 307 209 34 225 7 190Z" fill="#e6d9b8" stroke="#28221b" strokeWidth="4" />
    <rect x="12" y="18" width="305" height="200" fill={`url(#${flip ? 'shipDotsB' : 'shipDotsA'})`} />
    <g transform="translate(28 29)" stroke="#1d1c18" strokeWidth="5" strokeLinejoin="round">
      <path d="M0 137 C66 171 187 176 273 129 L247 166 34 178Z" fill="#352b22" />
      <path d="M132 17 V148" />
      <path d="M134 22 L54 116 134 108Z" fill="#d4c29f" />
      <path d="M137 37 L226 111 137 104Z" fill="#8c2d25" />
      <path d="M73 124 Q135 93 215 127" fill="none" stroke="#d5c29c" strokeWidth="7" />
      <circle cx="72" cy="144" r="8" fill="#d5c29c" />
      <circle cx="112" cy="151" r="8" fill="#d5c29c" />
      <circle cx="157" cy="151" r="8" fill="#d5c29c" />
      <circle cx="201" cy="143" r="8" fill="#d5c29c" />
    </g>
  </svg>
);

export const AssaultCutout: React.FC = () => (
  <svg width="930" height="860" viewBox="0 0 930 860">
    <defs>
      <InkDots id="assaultDots" />
      <linearGradient id="assaultSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#252d32" />
        <stop offset="1" stopColor="#7f6750" />
      </linearGradient>
    </defs>
    <path d="M26 37 L882 10 918 81 897 813 65 850 10 781 24 542 8 309Z" fill="#ddd0b1" stroke="#29221c" strokeWidth="5" />
    <g>
      <rect x="18" y="24" width="890" height="812" fill="url(#assaultSky)" />
      <rect x="18" y="24" width="890" height="812" fill="url(#assaultDots)" opacity=".5" />
      <circle cx="132" cy="139" r="58" fill="#e2d2a4" opacity=".7" />
      <path d="M0 711 C220 612 500 713 930 601 V860 H0Z" fill="#242521" />
      <g fill="#b7a077" stroke="#211d18" strokeWidth="7">
        <path d="M92 670 V322 H286 V670Z" />
        <path d="M320 670 V235 H546 V670Z" />
        <path d="M584 670 V352 H827 V670Z" />
      </g>
      <g fill="#25241f">
        <rect x="113" y="293" width="42" height="57" />
        <rect x="204" y="293" width="42" height="57" />
        <rect x="346" y="205" width="42" height="58" />
        <rect x="433" y="205" width="42" height="58" />
        <rect x="613" y="323" width="42" height="57" />
        <rect x="744" y="323" width="42" height="57" />
      </g>
      <path d="M515 268 L545 323 518 375 554 434 520 490 557 558 531 670" fill="none" stroke="#7c2922" strokeWidth="16" />
      <g stroke="#e0cfaa" strokeWidth="13" strokeLinecap="round">
        <path d="M205 726 L332 387" />
        <path d="M621 727 L706 432" />
      </g>
      <g stroke="#2b251f" strokeWidth="6">
        {Array.from({length: 8}).map((_, i) => (
          <path key={`l-${i}`} d={`M${210 + i * 15} ${692 - i * 40} L${252 + i * 15} ${703 - i * 40}`} />
        ))}
        {Array.from({length: 7}).map((_, i) => (
          <path key={`r-${i}`} d={`M${629 + i * 11} ${690 - i * 39} L${670 + i * 11} ${700 - i * 39}`} />
        ))}
      </g>
      <g fill="#171815">
        {Array.from({length: 17}).map((_, i) => {
          const x = 45 + i * 51;
          const y = 698 + (i % 3) * 18;
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <circle cx="0" cy="0" r="12" />
              <path d="M-12 13 H12 L18 78 H-18Z" />
              <path d="M4 18 L28 -18" stroke="#d8c8a5" strokeWidth="5" />
            </g>
          );
        })}
      </g>
      <path d="M551 571 C609 533 661 545 719 506" fill="none" stroke="#dfc58e" strokeWidth="13" strokeLinecap="round" opacity=".55" />
    </g>
  </svg>
);

export const FinalSkyline: React.FC = () => (
  <svg width="1010" height="830" viewBox="0 0 1010 830">
    <defs>
      <InkDots id="finalDots" />
      <linearGradient id="finalSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#b6c0ba" />
        <stop offset="1" stopColor="#d9c6a0" />
      </linearGradient>
    </defs>
    <path d="M21 39 L965 7 999 83 976 782 58 821 8 747 28 522 7 281Z" fill="#e6d9b8" stroke="#28221b" strokeWidth="5" />
    <g>
      <rect x="16" y="20" width="970" height="785" fill="url(#finalSky)" />
      <rect x="16" y="20" width="970" height="785" fill="url(#finalDots)" opacity=".66" />
      <circle cx="824" cy="150" r="70" fill="#8f2d25" opacity=".82" />
      <path d="M0 622 C205 550 390 637 1010 505 V830 H0Z" fill="#415252" opacity=".78" />
      <g fill="#24231f" stroke="#191713" strokeWidth="4">
        <path d="M39 635 V491 H100 V635Z" />
        <path d="M96 635 V430 H168 V635Z" />
        <path d="M159 635 V518 H230 V635Z" />
        <path d="M221 635 V396 H316 V635Z" />
        <path d="M302 635 V484 H374 V635Z" />
        <path d="M366 635 V338 H485 V635Z" />
        <path d="M475 635 V455 H558 V635Z" />
        <path d="M548 635 V405 H639 V635Z" />
        <path d="M628 635 V500 H703 V635Z" />
        <path d="M692 635 V378 H806 V635Z" />
        <path d="M794 635 V468 H868 V635Z" />
        <path d="M856 635 V424 H958 V635Z" />
      </g>
      <g transform="translate(325 167)" fill="#e2d3af" stroke="#26221c" strokeWidth="7">
        <path d="M34 392 V196 H302 V392Z" />
        <path d="M77 196 C83 77 251 77 259 196Z" />
        <path d="M98 196 C102 107 235 107 239 196Z" fill="#24231f" />
        <rect x="10" y="112" width="22" height="280" fill="#24231f" />
        <path d="M21 112 L8 71 21 20 34 71Z" fill="#24231f" />
        <rect x="304" y="101" width="22" height="291" fill="#24231f" />
        <path d="M315 101 L302 60 315 9 328 60Z" fill="#24231f" />
      </g>
      <g transform="translate(720 534)" fill="#1a1b18" stroke="#e3d5b5" strokeWidth="3">
        <path d="M0 71 C53 12 129 12 184 71 C129 92 52 92 0 71Z" />
        <rect x="78" y="10" width="10" height="63" />
        <path d="M83 12 L31 54 83 48Z" fill="#e3d5b5" />
      </g>
      <path d="M0 663 C280 613 584 704 1010 622" fill="none" stroke="#eee0bf" strokeWidth="14" opacity=".46" />
    </g>
  </svg>
);
