/** Brand banner — `public/logo-banner.png`. */
export const FORM_BANNER_SRC = "/logo-banner.png";
export const FORM_BANNER_ALT = "JCRE";

type FormBannerProps = {
  className?: string;
};

export function FormBanner({ className }: FormBannerProps = {}) {
  return (
    <img
      src={FORM_BANNER_SRC}
      alt={FORM_BANNER_ALT}
      className={className ? `page-brand-logo ${className}` : "page-brand-logo"}
    />
  );
}
