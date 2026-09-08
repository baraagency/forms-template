const BARA_AGENCY_URL = "https://baraagency.com/";

export function AppFooter() {
  return (
    <footer className="app-footer">
      <p className="app-footer__text">
        Created by{" "}
        <a
          href={BARA_AGENCY_URL}
          className="app-footer__link"
          target="_blank"
          rel="noopener noreferrer"
        >
          Bara Agency
        </a>
      </p>
    </footer>
  );
}
