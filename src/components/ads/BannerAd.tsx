import { useEffect, useRef } from "react";

interface BannerAdProps {
  className?: string;
}

export function BannerAd({ className = "" }: BannerAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!containerRef.current || loaded.current) return;
    loaded.current = true;

    const configScript = document.createElement("script");
    configScript.type = "text/javascript";
    configScript.text = `
      atOptions = {
        'key' : '60b102fe0a6bd36b3aa4e1cf27080918',
        'format' : 'iframe',
        'height' : 50,
        'width' : 320,
        'params' : {}
      };
    `;

    const invokeScript = document.createElement("script");
    invokeScript.type = "text/javascript";
    invokeScript.src =
      "https://openairtowhardworking.com/60b102fe0a6bd36b3aa4e1cf27080918/invoke.js";

    containerRef.current.appendChild(configScript);
    containerRef.current.appendChild(invokeScript);
  }, []);

  return (
    <div className={`flex justify-center overflow-hidden ${className}`}>
      <div ref={containerRef} style={{ maxWidth: 320, maxHeight: 50 }} />
    </div>
  );
}
