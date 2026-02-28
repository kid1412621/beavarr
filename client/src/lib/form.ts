import {
    createFormHook,
    createFormHookContexts,
    type AppFieldExtendedReactFormApi,
    type FormAsyncValidateOrFn,
    type FormValidateOrFn,
} from '@tanstack/react-form';

export const { formContext, fieldContext, useFieldContext, useFormContext } =
    createFormHookContexts();

const appForm = createFormHook({
    fieldComponents: {},
    formComponents: {},
    fieldContext,
    formContext,
});

export const { useAppForm } = appForm;

export type AppFormApi<
    TFormData,
    TOnMount extends undefined | FormValidateOrFn<TFormData> = undefined,
    TOnChange extends undefined | FormValidateOrFn<TFormData> = undefined,
    TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
    TOnBlur extends undefined | FormValidateOrFn<TFormData> = undefined,
    TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
    TOnSubmit extends undefined | FormValidateOrFn<TFormData> = undefined,
    TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
    TOnDynamic extends undefined | FormValidateOrFn<TFormData> = undefined,
    TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
    TOnServer extends undefined | FormAsyncValidateOrFn<TFormData> = undefined,
    TSubmitMeta = undefined,
> = AppFieldExtendedReactFormApi<
    TFormData,
    TOnMount,
    TOnChange,
    TOnChangeAsync,
    TOnBlur,
    TOnBlurAsync,
    TOnSubmit,
    TOnSubmitAsync,
    TOnDynamic,
    TOnDynamicAsync,
    TOnServer,
    TSubmitMeta,
    {},
    {}
>;

export function useAppFormContext<TFormData>() {
    return useFormContext() as unknown as AppFormApi<TFormData>;
}
