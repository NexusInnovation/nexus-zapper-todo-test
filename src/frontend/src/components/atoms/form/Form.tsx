import type { DetailedHTMLProps, FormHTMLAttributes } from 'react'
import { FormProvider } from 'react-hook-form'
import type {
  FieldValues,
  SubmitErrorHandler,
  SubmitHandler,
  UseFormReturn,
} from 'react-hook-form'

type FormProps<
  TFieldValues extends FieldValues,
  TTransformedValues extends FieldValues = TFieldValues,
> = {
  onSubmit: SubmitHandler<TTransformedValues>
  onInvalid?: SubmitErrorHandler<TFieldValues>
  formMethods: UseFormReturn<TFieldValues, unknown, TTransformedValues>
}

type FormPropsWithHTMLFormProps<
  TFieldValues extends FieldValues,
  TTransformedValues extends FieldValues = TFieldValues,
> = Omit<
  DetailedHTMLProps<FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>,
  'onSubmit'
> &
  FormProps<TFieldValues, TTransformedValues>

function Form<
  TFieldValues extends FieldValues,
  TTransformedValues extends FieldValues = TFieldValues,
>({
  children,
  formMethods,
  noValidate = true,
  onSubmit,
  onInvalid,
  ...rest
}: FormPropsWithHTMLFormProps<TFieldValues, TTransformedValues>) {
  return (
    <FormProvider {...formMethods}>
      <form
        noValidate={noValidate}
        onSubmit={formMethods.handleSubmit(onSubmit, onInvalid)}
        {...rest}
      >
        {children}
      </form>
    </FormProvider>
  )
}

export default Form
