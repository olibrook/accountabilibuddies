import { Controller, FieldError, useForm } from "react-hook-form";
import { api } from "@buds/trpc/react";
import React, { InputHTMLAttributes, useEffect } from "react";
import { ToggleButton } from "@buds/app/_components/AppShell";

export type SettingsFormFields = {
  username?: string;
  useMetric: boolean;
  checkMark: string;
};

export type SettingsHookForm = ReturnType<typeof useForm<SettingsFormFields>>;

export const FieldErrorDisplay = ({ error }: { error?: FieldError }) => {
  const color = error?.type === "info" ? "green" : "red";
  return (
    <p className="py-1 pr-1 text-right text-xs">
      {error ? (
        <span style={{ color }}>{error.message}</span>
      ) : (
        <span>&nbsp;</span>
      )}
    </p>
  );
};

export const TextInput = ({
  label,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
}) => (
  <div className={`relative ${className ?? ""}`}>
    <input
      {...rest}
      autoComplete="off"
      type="text"
      id="password"
      className="border-1 peer block w-full appearance-none rounded-lg border border-gray-300 bg-white px-2.5 pb-2.5 pt-4 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-0"
      placeholder=" "
    />
    <label
      htmlFor="password"
      className="absolute left-1 top-2 z-10 origin-[0] -translate-y-4 scale-75 transform cursor-text select-none bg-white px-2 text-sm text-gray-500 duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-blue-600"
    >
      {" "}
      {label}
    </label>
  </div>
);

export const SettingsForm = ({
  hookForm,
  submitButton,
  onSubmit: _onSubmit,
}: {
  hookForm: SettingsHookForm;
  submitButton?: React.ReactNode;
  onSubmit?: (v: SettingsFormFields) => void;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const noop = () => {};
  const onSubmit = _onSubmit ?? noop;

  const { data: me } = api.user.me.useQuery();
  const {
    control,
    formState: { errors },
    watch,
    setError,
    clearErrors,
    handleSubmit,
  } = hookForm;

  // TODO: As the user types their new username, check to see if
  // it's available and show that in the error field of the input
  const usernameAvailable = api.user.usernameAvailable.useMutation();

  useEffect(() => {
    const inner = async (val: { username: string }) => {
      const available = await usernameAvailable.mutateAsync(val);
      if (!available) {
        setError("username", { type: "error", message: "Username taken" });
      } else {
        clearErrors("username");
      }
    };
    // TODO: Watch just the one field. Then connect up the callbacks, etc.
    const subscription = watch((value, { name, type }) => {
      if (name === "username" && value.username) {
        void inner({ username: value.username });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  if (!me) {
    return null;
  }

  return (
    <div className="my-4 w-full">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Controller
          rules={{ minLength: 5 }}
          control={control}
          name="username"
          render={({ field }) => (
            <div className="flex w-full flex-col">
              <TextInput label="Username" {...field} />
              <FieldErrorDisplay error={errors.username} />
            </div>
          )}
        />
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <div className="mb-2 block flex items-center py-2">
              <ToggleButton
                value={value === "⭐"}
                onChange={(val) => {
                  onChange(val ? "⭐" : "💖");
                }}
                label="Use 💖 / ⭐ as progress emoji"
              />
            </div>
          )}
          name="checkMark"
        />
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <div className="mb-2 block flex items-center py-2">
              <ToggleButton
                onChange={onChange}
                value={value}
                label="Use imperial / metric units?"
              />
            </div>
          )}
          name="useMetric"
        />
        {submitButton && submitButton}
      </form>
    </div>
  );
};
