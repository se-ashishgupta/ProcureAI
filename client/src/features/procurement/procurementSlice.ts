import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { SEED_PROCUREMENTS } from "@/lib/mock-data";
import type {
  ProcurementCreator,
  ProcurementEvent,
  ProcurementStatus,
  VendorProposal,
  VendorProposalAnalysis,
  VendorProposalStatus,
} from "@/types";

const STORAGE_KEY = "procure_events";
const MAX_VENDOR_PROPOSALS = 4;

function loadEvents(): ProcurementEvent[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PROCUREMENTS));
    return SEED_PROCUREMENTS;
  }
  const events = JSON.parse(raw) as ProcurementEvent[];
  return events.map((event) => {
    if (event.createdBy) return event;
    const seed = SEED_PROCUREMENTS.find((s) => s.id === event.id);
    if (seed?.createdBy) return { ...event, createdBy: seed.createdBy };
    return event;
  });
}

function persist(events: ProcurementEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function findEvent(state: ProcurementState, id: string): ProcurementEvent | undefined {
  return state.events.find((e) => e.id === id);
}

interface ProcurementState {
  events: ProcurementEvent[];
  activeId: string | null;
}

const initialState: ProcurementState = {
  events: loadEvents(),
  activeId: null,
};

const procurementSlice = createSlice({
  name: "procurement",
  initialState,
  reducers: {
    setActiveProcurement: (state, action: PayloadAction<string | null>) => {
      state.activeId = action.payload;
    },
    createProcurement: (
      state,
      action: PayloadAction<{
        id?: string;
        title: string;
        requirement?: string;
        createdBy?: ProcurementCreator;
      }>,
    ) => {
      const event: ProcurementEvent = {
        id: action.payload.id ?? crypto.randomUUID(),
        title: action.payload.title,
        requirement: action.payload.requirement,
        status: "draft",
        vendorProposals: [],
        createdBy: action.payload.createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.events.unshift(event);
      state.activeId = event.id;
      persist(state.events);
    },
    updateProcurement: (
      state,
      action: PayloadAction<Partial<ProcurementEvent> & { id: string }>,
    ) => {
      const idx = state.events.findIndex((e) => e.id === action.payload.id);
      if (idx === -1) return;
      state.events[idx] = {
        ...state.events[idx],
        ...action.payload,
        updatedAt: new Date().toISOString(),
      };
      persist(state.events);
    },
    setProcurementStatus: (
      state,
      action: PayloadAction<{ id: string; status: ProcurementStatus }>,
    ) => {
      const event = state.events.find((e) => e.id === action.payload.id);
      if (!event) return;
      event.status = action.payload.status;
      event.updatedAt = new Date().toISOString();
      persist(state.events);
    },
    addVendorProposal: (
      state,
      action: PayloadAction<{
        procurementId: string;
        vendorName: string;
        fileName: string;
        fileSize?: number;
        proposalId?: string;
        proposalText?: string;
      }>,
    ) => {
      const event = findEvent(state, action.payload.procurementId);
      if (!event) return;

      if (!event.vendorProposals) event.vendorProposals = [];
      if (event.vendorProposals.length >= MAX_VENDOR_PROPOSALS) return;

      const proposal: VendorProposal = {
        id: action.payload.proposalId ?? crypto.randomUUID(),
        vendorName: action.payload.vendorName.trim(),
        fileName: action.payload.fileName,
        fileSize: action.payload.fileSize,
        proposalText: action.payload.proposalText,
        status: "uploaded",
        uploadedAt: new Date().toISOString(),
      };

      event.vendorProposals.push(proposal);
      event.updatedAt = new Date().toISOString();
      persist(state.events);
    },
    setVendorProposalStatus: (
      state,
      action: PayloadAction<{
        procurementId: string;
        proposalId: string;
        status: VendorProposalStatus;
      }>,
    ) => {
      const event = findEvent(state, action.payload.procurementId);
      if (!event?.vendorProposals) return;

      const proposal = event.vendorProposals.find(
        (p) => p.id === action.payload.proposalId,
      );
      if (!proposal) return;

      proposal.status = action.payload.status;
      event.updatedAt = new Date().toISOString();
      persist(state.events);
    },
    completeVendorProposalAnalysis: (
      state,
      action: PayloadAction<{
        procurementId: string;
        proposalId: string;
        analysis: VendorProposalAnalysis;
      }>,
    ) => {
      const event = findEvent(state, action.payload.procurementId);
      if (!event?.vendorProposals) return;

      const proposal = event.vendorProposals.find(
        (p) => p.id === action.payload.proposalId,
      );
      if (!proposal) return;

      proposal.status = "parsing_complete";
      proposal.analysis = action.payload.analysis;
      event.updatedAt = new Date().toISOString();

      const allParsed =
        event.vendorProposals.length > 0 &&
        event.vendorProposals.every((p) => p.status === "parsing_complete");

      if (allParsed) {
        event.status = "evaluation_ready";
      }

      persist(state.events);
    },
    removeVendorProposal: (
      state,
      action: PayloadAction<{ procurementId: string; proposalId: string }>,
    ) => {
      const event = findEvent(state, action.payload.procurementId);
      if (!event?.vendorProposals) return;

      event.vendorProposals = event.vendorProposals.filter(
        (p) => p.id !== action.payload.proposalId,
      );
      event.updatedAt = new Date().toISOString();
      persist(state.events);
    },
    setAwardedVendor: (
      state,
      action: PayloadAction<{ procurementId: string; proposalId: string }>,
    ) => {
      const event = findEvent(state, action.payload.procurementId);
      if (!event) return;

      event.awardedVendorId = action.payload.proposalId;
      event.status = "award_decided";
      event.updatedAt = new Date().toISOString();
      persist(state.events);
    },
    updateVendorProposal: (
      state,
      action: PayloadAction<{
        procurementId: string;
        proposalId: string;
        patch: Partial<VendorProposal>;
      }>,
    ) => {
      const event = findEvent(state, action.payload.procurementId);
      if (!event?.vendorProposals) return;

      const proposal = event.vendorProposals.find(
        (p) => p.id === action.payload.proposalId,
      );
      if (!proposal) return;

      Object.assign(proposal, action.payload.patch);
      event.updatedAt = new Date().toISOString();
      persist(state.events);
    },
    failVendorProposalAnalysis: (
      state,
      action: PayloadAction<{ procurementId: string; proposalId: string }>,
    ) => {
      const event = findEvent(state, action.payload.procurementId);
      if (!event?.vendorProposals) return;

      const proposal = event.vendorProposals.find(
        (p) => p.id === action.payload.proposalId,
      );
      if (!proposal) return;

      proposal.status = "error";
      event.updatedAt = new Date().toISOString();
      persist(state.events);
    },
  },
});

export const {
  setActiveProcurement,
  createProcurement,
  updateProcurement,
  setProcurementStatus,
  addVendorProposal,
  setVendorProposalStatus,
  completeVendorProposalAnalysis,
  removeVendorProposal,
  setAwardedVendor,
  updateVendorProposal,
  failVendorProposalAnalysis,
} = procurementSlice.actions;

export default procurementSlice.reducer;
