import { Button } from '@/components/ui/button';
import {
  FieldDescription as FieldDescriptionPrimitive,
  FieldError as FieldErrorPrimitive,
  FieldLabel as FieldLabelPrimitive,
  Field as FieldPrimitive,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input.js';
import type { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slot } from '@radix-ui/react-slot';
import { createFormHookContexts, useStore } from '@tanstack/react-form';
import * as React from 'react';
import type { ReactNode } from 'react';

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

// Internal context for per-field unique IDs
const IdContext = React.createContext<string | null>(null);

function useFieldComponentContext() {
  const field = useFieldContext();
  const id = React.useContext(IdContext);

  if (!id) throw new Error('Form field components must be used within <Field>');

  const errors = useStore(field.store, (s) => s.meta.errors);
  const isTouched = useStore(field.store, (s) => s.meta.isTouched);
  const submissionAttempts = useStore(
    field.form.store,
    (s) => s.submissionAttempts,
  );

  return React.useMemo(() => {
    const showError = isTouched || submissionAttempts > 0;
    let errorMessage: string | null = null;

    if (showError && errors.length > 0) {
      const err = errors[0];
      if (typeof err === 'string') errorMessage = err;
      else if (err && typeof err === 'object' && 'message' in err)
        errorMessage = String((err as { message: unknown }).message);
      else if (err != null) errorMessage = String(err);
    }

    return {
      controlId: `${id}-control`,
      descriptionId: `${id}-description`,
      messageId: `${id}-message`,
      error: errorMessage,
      hasError: showError && errorMessage !== null,
    };
  }, [id, isTouched, submissionAttempts, errors]);
}

// <Form> — auto-handles submit event
function Form({ ...props }: React.ComponentProps<'form'>) {
  const form = useFormContext();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      {...props}
    />
  );
}

// <Field> — provides ID context, sets data-invalid
function Field({
  className,
  ...props
}: React.ComponentProps<typeof FieldPrimitive>) {
  const uid = React.useId();
  const field = useFieldContext();
  const errors = useStore(field.store, (s) => s.meta.errors);
  const isTouched = useStore(field.store, (s) => s.meta.isTouched);
  const submissionAttempts = useStore(
    field.form.store,
    (s) => s.submissionAttempts,
  );
  const hasError = (isTouched || submissionAttempts > 0) && errors.length > 0;

  return (
    <IdContext.Provider value={uid}>
      <FieldPrimitive
        data-invalid={hasError ? 'true' : undefined}
        className={className}
        {...props}
      />
    </IdContext.Provider>
  );
}

// <FieldLabel> — auto-wires htmlFor
function FieldLabel({ ...props }: React.ComponentProps<typeof Label>) {
  const { controlId } = useFieldComponentContext();
  return <FieldLabelPrimitive htmlFor={controlId} {...props} />;
}

// <FieldControl> — passes id + aria attrs to child via Slot
function FieldControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { controlId, descriptionId, messageId, hasError } =
    useFieldComponentContext();
  const describedBy = [descriptionId, hasError ? messageId : null]
    .filter(Boolean)
    .join(' ');
  return (
    <Slot
      id={controlId}
      aria-describedby={describedBy || undefined}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}

// <FieldDescription> — auto-wires id
function FieldDescription({
  ...props
}: React.ComponentProps<typeof FieldDescriptionPrimitive>) {
  const { descriptionId } = useFieldComponentContext();
  return <FieldDescriptionPrimitive id={descriptionId} {...props} />;
}

// <FieldError> — auto-reads errors from context
function FieldError({
  ...props
}: React.ComponentProps<typeof FieldErrorPrimitive>) {
  const { error, messageId } = useFieldComponentContext();
  if (!error) return null;
  return (
    <FieldErrorPrimitive id={messageId} {...props}>
      {error}
    </FieldErrorPrimitive>
  );
}

type FieldWrapperProps = {
  label: ReactNode;
  control: ReactNode;
};

function FieldWrapper({ label, control }: FieldWrapperProps) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <FieldControl>{control}</FieldControl>
      <FieldError />
    </Field>
  );
}

type InputFieldProps = {
  label: string;
} & React.ComponentProps<'input'>;

function InputField({ label, ...props }: InputFieldProps) {
  // biome-ignore lint/suspicious/noExplicitAny: field stores string | number | null depending on the schema
  const field = useFieldContext<any>();

  return (
    <FieldWrapper
      label={label}
      control={
        <Input
          {...props}
          value={field.state.value ?? ''}
          onBlur={field.handleBlur}
          onChange={(e) => {
            if (props.type === 'number') {
              field.handleChange(
                e.target.value === '' ? null : e.target.valueAsNumber,
              );
            } else {
              field.handleChange(e.target.value);
            }
          }}
        />
      }
    />
  );
}

type TextAreaFieldProps = {
  label: string;
} & React.ComponentProps<'textarea'>;

function TextAreaField({ label, ...props }: TextAreaFieldProps) {
  const field = useFieldContext<string>();

  return (
    <FieldWrapper
      label={label}
      control={
        <Textarea
          {...props}
          value={field.state.value ?? ''}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
        />
      }
    />
  );
}

type SelectOption = {
  label: string;
  value: string;
};

type SelectFieldProps = {
  label: string;
  options: readonly SelectOption[];
  placeholder?: string;
};

function SelectField({ label, options, placeholder }: SelectFieldProps) {
  const field = useFieldContext<string>();

  return (
    <FieldWrapper
      label={label}
      control={
        <Select
          value={field.state.value}
          onValueChange={(v) => field.handleChange(v)}
        >
          <SelectTrigger onBlur={field.handleBlur}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map(({ label: optionLabel, value }) => (
              <SelectItem key={value} value={value}>
                {optionLabel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    />
  );
}

type SubmitButtonProps = {
  isEdit?: boolean;
  createLabel?: string;
  editLabel?: string;
  savingLabel?: string;
} & Omit<React.ComponentProps<typeof Button>, 'type' | 'disabled' | 'children'>;

// Standardizes the submit control across every form dialog: reads canSubmit /
// isSubmitting from form context and always guards against double-submit.
function SubmitButton({
  isEdit = false,
  createLabel = 'Create',
  editLabel = 'Save changes',
  savingLabel = 'Saving…',
  ...props
}: SubmitButtonProps) {
  const form = useFormContext();
  const canSubmit = useStore(form.store, (s) => s.canSubmit);
  const isSubmitting = useStore(form.store, (s) => s.isSubmitting);

  return (
    <Button type="submit" disabled={!canSubmit || isSubmitting} {...props}>
      {isSubmitting ? savingLabel : isEdit ? editLabel : createLabel}
    </Button>
  );
}

export {
  Form,
  Field,
  FieldLabel,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldWrapper,
  InputField,
  TextAreaField,
  SelectField,
  SubmitButton,
};
