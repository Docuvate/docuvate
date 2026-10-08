type AuthFormErrorProps = {
  id: string;
  message: string;
};

export function AuthFormError({ id, message }: AuthFormErrorProps) {
  if (!message) {
    return null;
  }
  return (
    <p id={id} className="error auth-form-error" role="alert" aria-live="assertive">
      {message}
    </p>
  );
}
