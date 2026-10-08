/** better-auth generates 24-char reset tokens; allow modest buffer for future changes. */
export const PASSWORD_RESET_TOKEN_MAX_LENGTH = 128;

export const PASSWORD_RESET_DUMMY_VERIFICATION_IDENTIFIER =
  'reset-password:dummy-verification-token';
