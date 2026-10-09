import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FitVision — AR Virtual Try-On SaaS",
  description:
    "B2B AR Virtual Try-On platform. Integrate real-time garment try-on into any e-commerce store — zero backend GPU cost, powered by WebAssembly and WebGL in the browser.",
  keywords: ["AR try-on", "virtual fitting room", "e-commerce SaaS", "WebGL", "fashion tech"],
};

export default function SaasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
