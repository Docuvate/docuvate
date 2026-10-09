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
