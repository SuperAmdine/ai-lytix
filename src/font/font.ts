import localFont from "next/font/local";
export const synonim = localFont( {
  src: "./fontSynonim.woff2",
  variable: "--font-synonim",
} );
export const amulya = localFont( {
  src: "./fontAmulya.woff2",
  variable: "--font-amulya",
} );
export const satoshi = localFont( {
  src: "./fontSatoshi.woff2",
  variable: "--font-satoshi",
} );

export const inter = localFont( {
  src: [
    { path: "InterVariable.woff2", weight: "100 900", style: "normal" },
    {
      path: "./InterVariable-Italic.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-inter",
} );

export const source = localFont( {
  src: [
    {
      path: "./SourceSansPro-Regular.ttf.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-source-sans-pro",
} );

export const plexMono = localFont( {
  src: [
    {
      path: "./IBMPlexMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./IBMPlexMono-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "./IBMPlexMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./IBMPlexMono-MediumItalic.woff2",
      weight: "500",
      style: "italic",
    },
    {
      path: "./IBMPlexMono-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./IBMPlexMono-SemiBoldItalic.woff2",
      weight: "600",
      style: "italic",
    },
  ],
  variable: "--font-plex-mono",
} );
export const ubuntuMono = localFont( {
  src: [
    {
      path: "./Ubuntu-Mono-bold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-ubuntu-mono",
} );
