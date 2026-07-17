"use client";

import Alert from "@mui/material/Alert";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Notice,
  SectionCard,
  SelectInput,
  Spinner,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@baraagency/components";
import type { FUBDeal, FUBPerson } from "@/app/types/fub";
import { FormBanner } from "./_core/FormBanner";
import {
  getLocalDemoFixtureIds,
} from "./_core/localFormsDemo";
import {
  buildFormRouteUrl,
  filterDealsForForm,
  getDealLabel,
  getDealSisuTransactionId,
  getDealStageLabel,
  getDealTypeLabel,
  getPersonLabel,
  hasFubContext,
  parseFormRouterQuery,
  parsePositiveInteger,
  type AgentOption,
  type FormRouterFormKey,
} from "./_core/formRouterUtils";

type EmbeddedContextResponse = {
  clientName?: string;
  fubUserId?: number;
  fubUserName?: string;
  fubPersonId?: number;
  accountId?: number;
};

type FormKey = FormRouterFormKey;

const availableForms: Array<{
  key: FormKey;
  title: string;
  description: string;
  pathname: string;
}> = [
  {
    key: "pending",
    title: "Pending",
    description: "Route to the under-contract transaction intake flow.",
    pathname: "/forms/pending",
  },
  {
    key: "appointment-set",
    title: "Appointment Set",
    description: "Schedule an appointment and capture client intake details.",
    pathname: "/forms/appointment-set",
  },
];

const createNewDealValue = "create-new";

function notifyEmbeddedHeight(): void {
  const appApi = (window as Window & { FUB?: { updateHeight?: () => void } })
    .FUB;
  if (typeof appApi?.updateHeight === "function") {
    appApi.updateHeight();
  }
}

function buildCurrentUrl(clientId: number | null): string {
  const url = new URL(window.location.href);
  if (clientId) {
    url.searchParams.set("clientId", String(clientId));
  }
  return url.toString();
}

function subscribeToLocationChanges(onStoreChange: () => void): () => void {
  const notify = () => onStoreChange();

  window.addEventListener("popstate", notify);

  const { pushState, replaceState } = history;
  history.pushState = (...args) => {
    pushState.apply(history, args);
    notify();
  };
  history.replaceState = (...args) => {
    replaceState.apply(history, args);
    notify();
  };

  return () => {
    window.removeEventListener("popstate", notify);
    history.pushState = pushState;
    history.replaceState = replaceState;
  };
}

function getLocationSearchSnapshot(): string {
  return window.location.search;
}

function getServerLocationSearchSnapshot(): string {
  return "";
}

async function readMessageFromResponse(
  response: Response,
): Promise<string | null> {
  const bodyText = await response.text();
  if (!bodyText.trim()) {
    return null;
  }

  try {
    const parsed = JSON.parse(bodyText) as { message?: unknown };
    return typeof parsed.message === "string" ? parsed.message : null;
  } catch {
    return bodyText.slice(0, 200);
  }
}

export function FormRouterClient({
  localDemoEnabled = false,
}: {
  localDemoEnabled?: boolean;
} = {}) {
  const locationSearch = useSyncExternalStore(
    subscribeToLocationChanges,
    getLocationSearchSnapshot,
    getServerLocationSearchSnapshot,
  );
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [contextData, setContextData] =
    useState<EmbeddedContextResponse | null>(null);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [clients, setClients] = useState<FUBPerson[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentsError, setAgentsError] = useState<string | null>(null);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [agentOverride, setAgentOverride] = useState<string | null>(null);
  const [clientOverride, setClientOverride] = useState<string | null>(null);
  const [selectedForm, setSelectedForm] = useState<FormKey | null>(null);
  const [deals, setDeals] = useState<FUBDeal[]>([]);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [dealsError, setDealsError] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState("");

  const query = useMemo(
    () => parseFormRouterQuery(locationSearch),
    [locationSearch],
  );
  const isEmbeddedInFub = Boolean(query.context && query.signature);
  const hasEmbeddedFubContext = hasFubContext(query, contextData);
  const localDemoFixtures = getLocalDemoFixtureIds();
  const isLocalDemoSession = Boolean(
    localDemoEnabled && !isEmbeddedInFub && !query.personId,
  );
  const presetClientId =
    query.personId ??
    (contextData?.fubPersonId ? String(contextData.fubPersonId) : "");
  const selectedClient =
    clientOverride ??
    presetClientId ??
    (isLocalDemoSession ? localDemoFixtures.personId : "");
  const selectedAgentFilter =
    agentOverride ??
    query.agentId ??
    (isLocalDemoSession ? localDemoFixtures.agentId : "");
  const clientData = clients.find(
    (client) => String(client.id) === selectedClient,
  );
  const selectedAgent =
    selectedAgentFilter ||
    (clientData?.assignedUserId ? String(clientData.assignedUserId) : "");
  const selectedAgentName =
    agents.find((agent) => String(agent.id) === String(selectedAgent))?.name ??
    (isLocalDemoSession ? localDemoFixtures.agentName : "");
  const effectivePersonId = parsePositiveInteger(selectedClient);
  const hasValidPersonId = Boolean(effectivePersonId);
  const selectedClientName = clientData
    ? getPersonLabel(clientData)
    : (contextData?.clientName ??
      (isLocalDemoSession ? localDemoFixtures.clientName : ""));
  const isWaitingForEmbeddedClientContext = Boolean(
    query.context && !query.personId && !contextData?.fubPersonId,
  );
  const selectedFormConfig = availableForms.find(
    (form) => form.key === selectedForm,
  );
  const filteredDeals = selectedForm ? filterDealsForForm(deals) : [];
  const selectedFormSupportsCreateNew = Boolean(selectedFormConfig?.pathname);
  const shouldShowDealSelection = Boolean(selectedForm && hasValidPersonId);

  useEffect(() => {
    if (!query.context || !query.signature) {
      return;
    }

    const controller = new AbortController();

    const loadContext = async (): Promise<void> => {
      try {
        setContextLoading(true);
        setContextError(null);
        const url = new URL("/api/fub/context", window.location.origin);
        url.searchParams.set("context", query.context ?? "");
        url.searchParams.set("signature", query.signature ?? "");

        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          const errorMessage = await readMessageFromResponse(response);
          throw new Error(
            errorMessage ??
              `Unable to load embedded context (HTTP ${response.status}).`,
          );
        }

        const payload = (await response.json()) as EmbeddedContextResponse;
        setContextData(payload);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Unable to load embedded context.";
        setContextError(message);
      } finally {
        setContextLoading(false);
      }
    };

    void loadContext();
    return () => controller.abort();
  }, [query.context, query.signature]);

  useEffect(() => {
    const controller = new AbortController();

    const loadUsers = async (): Promise<void> => {
      try {
        setAgentsLoading(true);
        setAgentsError(null);
        const response = await fetch("/api/fub/users", {
          signal: controller.signal,
        });
        if (!response.ok) {
          const errorMessage = await readMessageFromResponse(response);
          throw new Error(
            errorMessage ?? `Unable to load agents (HTTP ${response.status}).`,
          );
        }

        const payload = (await response.json()) as { users: AgentOption[] };
        setAgents(payload.users);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Unable to load agents.";
        setAgentsError(message);
      } finally {
        setAgentsLoading(false);
      }
    };

    void loadUsers();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (isWaitingForEmbeddedClientContext) {
      return;
    }

    const controller = new AbortController();

    const loadClients = async (): Promise<void> => {
      try {
        setClientsLoading(true);
        setClientsError(null);

        if (selectedAgentFilter) {
          const params = new URLSearchParams({
            limit: "100",
            assignedUserId: selectedAgentFilter,
          });
          const response = await fetch(`/api/fub/people?${params.toString()}`, {
            signal: controller.signal,
          });
          if (!response.ok) {
            const errorMessage = await readMessageFromResponse(response);
            throw new Error(
              errorMessage ??
                `Unable to load clients (HTTP ${response.status}).`,
            );
          }
          const payload = (await response.json()) as FUBPerson[];
          setClients(Array.isArray(payload) ? payload : []);
          return;
        }

        if (presetClientId) {
          const response = await fetch(`/api/fub/people/${presetClientId}`, {
            signal: controller.signal,
          });
          if (!response.ok) {
            const errorMessage = await readMessageFromResponse(response);
            throw new Error(
              errorMessage ??
                `Unable to load client (HTTP ${response.status}).`,
            );
          }
          const payload = (await response.json()) as FUBPerson | null;
          setClients(payload ? [payload] : []);
          return;
        }

        const response = await fetch("/api/fub/people?limit=100", {
          signal: controller.signal,
        });
        if (!response.ok) {
          const errorMessage = await readMessageFromResponse(response);
          throw new Error(
            errorMessage ?? `Unable to load clients (HTTP ${response.status}).`,
          );
        }
        const payload = (await response.json()) as FUBPerson[];
        setClients(Array.isArray(payload) ? payload : []);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Unable to load clients.";
        setClientsError(message);
      } finally {
        setClientsLoading(false);
      }
    };

    void loadClients();
    return () => controller.abort();
  }, [isWaitingForEmbeddedClientContext, presetClientId, selectedAgentFilter]);

  useEffect(() => {
    if (!effectivePersonId || !selectedForm) {
      return;
    }

    const controller = new AbortController();

    const loadDeals = async (): Promise<void> => {
      try {
        setDealsLoading(true);
        setDealsError(null);
        const response = await fetch(
          `/api/fub/deals?personId=${effectivePersonId}`,
          {
            signal: controller.signal,
          },
        );
        if (!response.ok) {
          const errorMessage = await readMessageFromResponse(response);
          throw new Error(
            errorMessage ??
              `Unable to load FUB deals (HTTP ${response.status}).`,
          );
        }

        const payload = (await response.json()) as { deals: FUBDeal[] };
        setDeals(payload.deals);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Unable to load FUB deals.";
        setDealsError(message);
      } finally {
        setDealsLoading(false);
      }
    };

    void loadDeals();
    return () => controller.abort();
  }, [effectivePersonId, selectedForm]);

  useEffect(() => {
    notifyEmbeddedHeight();
  }, [
    agentsError,
    agentsLoading,
    clientsError,
    clientsLoading,
    contextError,
    contextLoading,
    dealsError,
    dealsLoading,
    selectedAgent,
    selectedClient,
    selectedDealId,
    selectedForm,
  ]);

  function routeToForm(
    formKey: FormKey,
    dealId: string,
    sisuTransactionId: string | null,
  ) {
    const form = availableForms.find(
      (availableForm) => availableForm.key === formKey,
    );
    if (!form) {
      return;
    }

    if (!form.pathname || !effectivePersonId) {
      return;
    }

    window.location.assign(
      buildFormRouteUrl(form.pathname, {
        clientId: effectivePersonId,
        agentId: parsePositiveInteger(selectedAgent),
        agentName: selectedAgentName,
        clientName: selectedClientName,
        dealId,
        sisuTransactionId,
        context: query.context,
        signature: query.signature,
      }),
    );
  }

  function handleCreateNewDeal() {
    if (!selectedForm || !selectedFormSupportsCreateNew) {
      return;
    }

    routeToForm(selectedForm, createNewDealValue, null);
  }

  function handleDealClick(deal: FUBDeal) {
    const dealId = String(deal.id);
    if (!selectedForm) {
      return;
    }

    routeToForm(selectedForm, dealId, getDealSisuTransactionId(deal));
  }

  const handleAgentChange = useCallback((agentId: string) => {
    setAgentOverride(agentId);
    setClientOverride("");
    setSelectedDealId("");
    setDeals([]);
    setSelectedForm(null);
  }, []);

  const handleClientChange = useCallback((clientId: string) => {
    setClientOverride(clientId);
    setSelectedDealId("");
    setSelectedForm(null);
    if (!clientId) {
      setDeals([]);
    }
  }, []);

  return (
    <main
      className={`page-form${isEmbeddedInFub ? " page-form--embedded" : ""}`}
    >
      <title>Form Router</title>

      <header
        className={`page-header${isEmbeddedInFub ? " page-header--embedded" : ""}`}
      >
        <FormBanner />
      </header>

      <div className="form-router space-y-6">
        {!selectedForm ? (
          <SectionCard title="Forms">
            <div className="flex flex-col gap-4">
              <SelectInput
                id="assigned-agent"
                label="Agent"
                value={selectedAgent}
                disabled={agentsLoading || Boolean(agentsError)}
                onChange={(event) => handleAgentChange(event.target.value)}
              >
                <option value="">
                  {agentsLoading ? "Loading agents..." : "Select an agent..."}
                </option>
                {agents.map((agent) => (
                  <option key={agent.id} value={String(agent.id)}>
                    {agent.name}
                  </option>
                ))}
              </SelectInput>
              {agentsError ? (
                <Alert severity="warning">{agentsError}</Alert>
              ) : null}
              <SelectInput
                id="client"
                label="Client"
                value={selectedClient}
                disabled={
                  clientsLoading ||
                  isWaitingForEmbeddedClientContext ||
                  (!selectedAgent && !presetClientId)
                }
                onChange={(event) => handleClientChange(event.target.value)}
              >
                <option value="">
                  {clientsLoading || isWaitingForEmbeddedClientContext
                    ? "Loading clients..."
                    : !selectedAgent && !presetClientId
                      ? "Select an agent first..."
                      : "Select client..."}
                </option>
                {clients.map((client) => (
                  <option key={String(client.id)} value={String(client.id)}>
                    {getPersonLabel(client)}
                  </option>
                ))}
              </SelectInput>
              {isLocalDemoSession ? (
                <Notice tone="warning">
                  Local demo mode — using fixture client{" "}
                  {localDemoFixtures.personId} and agent{" "}
                  {localDemoFixtures.agentId}. All API responses are mocked.
                </Notice>
              ) : null}
              {contextLoading ? (
                <Notice tone="warning">
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    Loading embedded Follow Up Boss context...
                  </span>
                </Notice>
              ) : null}
              {contextError ? (
                <Alert severity="warning">{contextError}</Alert>
              ) : null}
              {clientsError ? (
                <Alert severity="warning">{clientsError}</Alert>
              ) : null}
              {!hasValidPersonId && !isLocalDemoSession ? (
                <Notice tone="warning">
                  A valid clientId is required before a form can be selected.
                </Notice>
              ) : null}
              <div className="form-router-form-choices">
                {availableForms.map((form) => (
                  <button
                    key={form.key}
                    type="button"
                    disabled={!hasValidPersonId}
                    onClick={() => {
                      setSelectedForm(form.key);
                      setSelectedDealId("");
                      setDeals([]);
                      setDealsError(null);
                    }}
                    className="form-router-launch-button app-button-press w-full"
                  >
                    <span className="form-router-launch-button__title">
                      {form.title}
                    </span>
                    <span className="form-router-launch-button__description">
                      {form.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>
        ) : null}

        {shouldShowDealSelection ? (
          <SectionCard
            title={`${selectedFormConfig?.title ?? "Selected Form"} Deals`}
            description={
              selectedFormSupportsCreateNew
                ? "Choose an active matching FUB deal, or start a new deal from this form."
                : "Choose an active matching FUB deal for this workflow."
            }
          >
            <div className="flex flex-col gap-4">
              {selectedAgentName || selectedClientName ? (
                <p className="settings-hint m-0">
                  {[selectedAgentName, selectedClientName]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
              {dealsError ? (
                <Alert severity="warning">{dealsError}</Alert>
              ) : null}
              {dealsLoading ? (
                <Notice tone="warning">
                  <span className="inline-flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    Loading active deals...
                  </span>
                </Notice>
              ) : null}
              {!dealsLoading && filteredDeals.length ? (
                <div className="grid gap-3">
                  {filteredDeals.map((deal) => {
                    const stageLabel = getDealStageLabel(deal);

                    return (
                      <button
                        key={String(deal.id)}
                        type="button"
                        className="form-choice-button w-full"
                        onClick={() => handleDealClick(deal)}
                      >
                        <span className="form-choice-button__title">
                          {getDealLabel(deal)}
                        </span>
                        <span className="form-choice-button__meta">
                          Type: {getDealTypeLabel(deal)}
                        </span>
                        {stageLabel ? (
                          <span className="form-choice-button__meta">
                            Stage: {stageLabel}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
              {!dealsLoading && filteredDeals.length === 0 ? (
                <Notice tone="warning">
                  No active matching FUB deals were found. Closed and lost deals
                  are hidden.
                </Notice>
              ) : null}
              {selectedFormSupportsCreateNew ? (
                <button
                  type="button"
                  className={`app-button-press ${primaryButtonClassName} w-full`}
                  onClick={handleCreateNewDeal}
                >
                  Create New Deal
                </button>
              ) : null}
              <div className="flex justify-start">
                <button
                  type="button"
                  className={secondaryButtonClassName}
                  onClick={() => {
                    setSelectedForm(null);
                    setSelectedDealId("");
                    setDeals([]);
                    setDealsError(null);
                  }}
                >
                  Change form
                </button>
              </div>
            </div>
          </SectionCard>
        ) : null}

        {hasEmbeddedFubContext ? (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              className={`app-button-press ${secondaryButtonClassName} w-full`}
              onClick={() => {
                window.open(
                  buildCurrentUrl(effectivePersonId),
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
            >
              Open Form Router in New Tab
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
