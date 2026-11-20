import { useQuery } from '@tanstack/react-query';

import { auditApi } from '../api/auditApi';
import { auditKeys } from '../api/auditKeys';

// The parts of one card. The detail screen mounts one view at a time, so a part loads only when
// its view opens. All of them sit under the card's `detail` key, so an action refreshes them with
// it. They keep `staleTime: 0` because what the user may do in them follows the card's status.

export function useAuditChecklists(uuid: string) {
  return useQuery({
    queryKey: auditKeys.part(uuid, 'checklists'),
    queryFn: ({ signal }) => auditApi.checklists(uuid, signal),
    staleTime: 0,
  });
}

export function useAuditAttachments(uuid: string) {
  return useQuery({
    queryKey: auditKeys.part(uuid, 'attachments'),
    queryFn: ({ signal }) => auditApi.attachments(uuid, signal),
    staleTime: 0,
  });
}

export function useAuditPrograms(uuid: string) {
  return useQuery({
    queryKey: auditKeys.part(uuid, 'programs'),
    queryFn: ({ signal }) => auditApi.programs(uuid, signal),
    staleTime: 0,
  });
}

export function useAuditFindings(uuid: string) {
  return useQuery({
    queryKey: auditKeys.part(uuid, 'findings'),
    queryFn: ({ signal }) => auditApi.findings(uuid, signal),
    staleTime: 0,
  });
}

export function useAuditApprovals(uuid: string) {
  return useQuery({
    queryKey: auditKeys.part(uuid, 'approvals'),
    queryFn: ({ signal }) => auditApi.approvals(uuid, signal),
    staleTime: 0,
  });
}
