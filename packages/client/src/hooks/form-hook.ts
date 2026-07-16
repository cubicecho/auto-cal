import {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  InputField,
  SelectField,
  SubmitButton,
  TextAreaField,
  fieldContext,
  formContext,
} from '@/components/ui/form';
import { createFormHook } from '@tanstack/react-form';

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    Field,
    Label: FieldLabel,
    Control: FieldControl,
    Description: FieldDescription,
    Error: FieldError,
    InputField: InputField,
    TextAreaField: TextAreaField,
    SelectField: SelectField,
  },
  formComponents: {
    SubmitButton,
  },
});
