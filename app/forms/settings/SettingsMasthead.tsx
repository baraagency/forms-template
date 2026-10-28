import { FormBanner } from "../_core/FormBanner";
import { SettingsBackLink } from "./SettingsBackLink";

export function SettingsMasthead({ backLink = false }: { backLink?: boolean }) {
  return (
    <header className="settings-masthead">
      {backLink ? <SettingsBackLink variant="button" /> : null}
      <div className="settings-masthead__identity">
        <FormBanner className="settings-masthead__banner" />
        <div className="settings-masthead__copy">
          <h1 className="page-title settings-page-title">Form Settings</h1>
        </div>
      </div>
    </header>
  );
}
