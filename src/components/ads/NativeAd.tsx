import { useEffect, useRef } from "react";

interface NativeAdProps {
  className?: string;
}

export function NativeAd({ className = "" }: NativeAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || containerRef.current.hasChildNodes()) return;

    const script = document.createElement("script");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    script.src =
      "https://openairtowhardworking.com/c35c6f6f42ee902bbfca715ccd1d497f/invoke.js";

    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        ref={containerRef}
        id={`native-ad-${Math.random().toString(36).slice(2, 8)}`}
        data-container-id="container-c35c6f6f42ee902bbfca715ccd1d497f"
      />
      <div id="container-c35c6f6f42ee902bbfca715ccd1d497f" />
    </div>
  );
}
