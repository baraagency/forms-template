import { useEffect, useRef, useState } from "react";
import { useRouteLoaderData } from "react-router";
import {
  DEFAULT_APP_BRANDING,
  type AppBranding,
} from "@/app/theme/appTheme";

/** Built-in banner used when no hosted logo is configured. */
export const FORM_BANNER_SRC = "/logo-banner.png";
export const FORM_BANNER_ALT = DEFAULT_APP_BRANDING.logoAlt;

type RootBrandingData = {
  branding?: AppBranding;
};

type FormBannerProps = {
  className?: string;
};

export function FormBanner({ className }: FormBannerProps = {}) {
  const rootData = useRouteLoaderData("root") as RootBrandingData | undefined;
  const branding = rootData?.branding ?? DEFAULT_APP_BRANDING;
  const customSrc = branding.logoUrl || FORM_BANNER_SRC;
  const [failed, setFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setFailed(false);
    const image = imageRef.current;
    // An SSR-rendered image can fail before hydration, so onError never fires.
    if (image?.complete && image.naturalWidth === 0) {
      setFailed(true);
    }
  }, [customSrc]);

  const src = failed ? FORM_BANNER_SRC : customSrc;
  const alt = failed
    ? FORM_BANNER_ALT
    : branding.logoAlt || FORM_BANNER_ALT;

  return (
    <img
      ref={imageRef}
      src={src}
      alt={alt}
      className={className ? `page-brand-logo ${className}` : "page-brand-logo"}
      onError={() => setFailed(true)}
    />
  );
}
