// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { UserInvitationMailPayload } from '../../domain/invite-mailer.port.js';

/** Light theme colors from @docuvate/tokens (dist/js/tokens.js colorLight). */
const mailColors = {
  colorText: '#0f172a',
  colorTextMuted: '#475569',
  colorAccent: '#2f3e8c',
  colorAccentContrast: '#ffffff',
};

export function userInvitationMailSubject(
  installationName: string,
  locale: UserInvitationMailPayload['locale']
): string {
  if (locale === 'en') {
    return `Invitation to ${installationName}`;
  }
  return `Einladung zu ${installationName}`;
}

export function userInvitationMailText(payload: UserInvitationMailPayload): string {
  const { installationName, invitedName, inviteUrl, validityDays, locale } = payload;
  if (locale === 'en') {
    return [
      `Hello ${invitedName},`,
      '',
      `You have been invited to ${installationName}.`,
      `Set your password within ${String(validityDays)} days:`,
      inviteUrl,
      '',
      'If you did not expect this invitation, you can ignore this message.',
    ].join('\n');
  }
  return [
    `Guten Tag ${invitedName},`,
    '',
    `Sie wurden zu ${installationName} eingeladen.`,
    `Legen Sie Ihr Passwort innerhalb von ${String(validityDays)} Tagen fest:`,
    inviteUrl,
    '',
    'Wenn Sie diese Einladung nicht erwarten, ignorieren Sie diese Nachricht.',
  ].join('\n');
}

export function userInvitationMailHtml(payload: UserInvitationMailPayload): string {
  const { installationName, invitedName, inviteUrl, validityDays, locale } = payload;
  const intro =
    locale === 'en'
      ? `You have been invited to <strong>${escapeHtml(installationName)}</strong>.`
      : `Sie wurden zu <strong>${escapeHtml(installationName)}</strong> eingeladen.`;
  const validity =
    locale === 'en'
      ? `The link is valid for ${String(validityDays)} days.`
      : `Der Link ist ${String(validityDays)} Tage gültig.`;
  const cta = locale === 'en' ? 'Set password' : 'Passwort festlegen';
  const footer =
    locale === 'en'
      ? 'If you did not expect this invitation, you can ignore this message.'
      : 'Wenn Sie diese Einladung nicht erwarten, ignorieren Sie diese Nachricht.';

  return `<!DOCTYPE html>
<html lang="${locale}">
  <body style="font-family: system-ui, sans-serif; line-height: 1.5; color: ${mailColors.colorText};">
    <p>${locale === 'en' ? 'Hello' : 'Guten Tag'} ${escapeHtml(invitedName)},</p>
    <p>${intro}</p>
    <p>${validity}</p>
    <p><a href="${escapeHtml(inviteUrl)}" style="display:inline-block;padding:10px 16px;background:${mailColors.colorAccent};color:${mailColors.colorAccentContrast};text-decoration:none;border-radius:8px;">${cta}</a></p>
    <p style="font-size:0.9rem;color:${mailColors.colorTextMuted};">${footer}</p>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
