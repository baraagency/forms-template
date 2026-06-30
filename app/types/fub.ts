export interface FUBApiError {
  status: number;
  message: string;
  code?: string;
}

export interface FUBPerson {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  emails?: FUBContactMethod[];
  phones?: FUBContactMethod[];
  cellPhone?: string;
  stageId?: string | number;
  source?: string;
  assignedUserId?: string | number;
  tags?: string[];
  leadStatus?: string;
  stage?: string;
  address?: string;
  addresses?: FUBAddress[];
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  notes?: string;
  relationships?: FUBRelationship[];
  createdDate?: string;
  modifiedDate?: string;
  [key: string]: unknown;
}

export type FUBContactMethod = {
  value: string;
  type?: string;
  isPrimary?: number;
};

export type FUBAddress = {
  type?: string;
  street?: string;
  city?: string;
  state?: string;
  code?: string;
  country?: string;
  [key: string]: unknown;
};

export type FUBRelationshipPerson = {
  firstName?: string;
  lastName?: string;
  name?: string;
  fullName?: string;
  email?: string;
  emails?: FUBContactMethod[];
  phone?: string;
  mobilePhone?: string;
  cellPhone?: string;
  phones?: FUBContactMethod[];
  [key: string]: unknown;
};

export type FUBRelationship = FUBRelationshipPerson & {
  person?: FUBRelationshipPerson;
  relatedPerson?: FUBRelationshipPerson;
  relationship?: string;
  type?: string;
};

export interface FUBUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  createdDate?: string;
  modifiedDate?: string;
  permissions?: string[];
  [key: string]: unknown;
}

export interface FUBLeadSource {
  id: string | number;
  name: string;
  [key: string]: unknown;
}

export interface FUBDeal {
  id?: string | number;
  personId?: string | number;
  peopleIds?: number[];
  userIds?: number[];
  name?: string;
  status?: string;
  [key: string]: unknown;
}

export interface FUBNote {
  id?: string | number;
  personId?: string | number;
  subject?: string;
  body?: string;
  isHtml?: boolean;
  [key: string]: unknown;
}

export type FUBAppointmentInvitee = {
  personId?: number;
  userId?: number;
  name?: string;
  email?: string;
};

export type FUBAppointmentInput = {
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  typeId?: number;
  outcomeId?: number;
  invitees?: FUBAppointmentInvitee[];
};

export interface FUBAppointment extends Omit<FUBAppointmentInput, "invitees"> {
  id?: string | number;
  created?: string;
  updated?: string;
  outcome?: string | null;
  invitees?: FUBAppointmentInvitee[];
  [key: string]: unknown;
}

export interface FUBListAppointmentsResponse {
  appointments: FUBAppointment[];
  _metadata: FUBMetadata;
}

export type FUBTaskInput = {
  name: string;
  dueDate: string;
  assignedUserId: number;
  personId?: number;
  dealId?: number;
  description?: string;
  type?: string;
};

export interface FUBTask extends FUBTaskInput {
  id?: string | number;
  created?: string;
  updated?: string;
  completed?: boolean;
  [key: string]: unknown;
}

export interface FUBAppointmentOutcome {
  id: number;
  name: string;
  orderWeight?: number;
  [key: string]: unknown;
}

export interface FUBStage {
  id: string | number;
  name: string;
  orderWeight?: number;
  isProtected?: boolean;
  pipelineId?: string | number | null;
  description?: string;
  peopleCount?: number;
  [key: string]: unknown;
}

export interface FUBMetadata {
  total?: number;
  page?: number;
  perPage?: number;
  next?: string;
  [key: string]: unknown;
}

// Response types
export type FUBGetPersonResponse = FUBPerson;
export type FUBGetUserResponse = FUBUser;

export interface FUBListPeopleResponse {
  people: FUBPerson[];
  _metadata: FUBMetadata;
}

export interface FUBListUsersResponse {
  users: FUBUser[];
  _metadata: FUBMetadata;
}

export interface FUBListStagesResponse {
  stages: FUBStage[];
  _metadata: FUBMetadata;
}

export interface FUBListAppointmentOutcomesResponse {
  appointmentoutcomes: FUBAppointmentOutcome[];
  _metadata: FUBMetadata;
}

export interface FUBListLeadSourcesResponse {
  leadsources: FUBLeadSource[];
  _metadata: FUBMetadata;
}

export interface FUBListDealsResponse {
  deals: FUBDeal[];
  _metadata: FUBMetadata;
}
