"use client";

type ConfirmSubmitButtonProps = {
  children: React.ReactNode;
  message: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function ConfirmSubmitButton({
  children,
  message,
  ...buttonProps
}: ConfirmSubmitButtonProps) {
  return (
    <button
      {...buttonProps}
      onClick={(event) => {
        buttonProps.onClick?.(event);

        if (event.defaultPrevented) {
          return;
        }

        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      {children}
    </button>
  );
}
