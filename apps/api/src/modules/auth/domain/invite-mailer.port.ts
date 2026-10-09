// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
export type UserInvitationMailLocale = 'de' | 'en';

export type UserInvitationMailPayload = {
  to: string;
  invitationId: string;
  installationName: string;
  inviteUrl: string;
  invitedName: string;
  locale: UserInvitationMailLocale;
  validityDays: number;
};

export interface UserInvitationMailerPort {
  sendInvitation(payload: UserInvitationMailPayload): Promise<void>;
}
