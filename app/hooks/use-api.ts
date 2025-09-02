import libApi from "~/lib/axios";
import {
  isCancel,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Laravel-style validation errors:
 * - keys are field names
 * - values can be a single string or an array of strings (messages per field)
 */
export type ValidationErrors = Record<string, string[] | string>;

type Method = "get" | "post" | "put" | "patch" | "delete";

export type UseApiOptions<T> = {
  /**
   * Automatically cancel previous pending request when a new submit starts.
   * Default: true
   */
  autoCancel?: boolean;
  /**
   * Reset to initial values after a successful request.
   * Default: false
   */
  resetOnSuccess?: boolean;
  /**
   * Milliseconds to keep `recentlySuccessful = true` after success.
   * Default: 2000ms
   */
  recentlySuccessfulTimeout?: number;
  /**
   * Provide a custom Axios instance. Defaults to a basic axios instance.
   */
  axiosInstance?: AxiosInstance;
  /**
   * Force sending data as FormData (useful when uploading files).
   * Default: auto-detected based on values.
   */
  forceFormData?: boolean;
  /**
   * Transform outgoing data (e.g., cast, trim, change shape).
   * Similar to Inertia's transform().
   */
  transform?: (data: T) => any;
};

export type SubmitOptions<T> = {
  /**
   * Extra Axios config (headers, params, etc).
   */
  config?: AxiosRequestConfig;
  /**
   * Called right before request is sent. If it returns false, the submit is aborted.
   */
  onBefore?: (data: T) => boolean | void;
  /**
   * Called when request starts.
   */
  onStart?: () => void;
  /**
   * Called on upload progress (0-100).
   */
  onProgress?: (percent: number) => void;
  /**
   * Called on success (response + data).
   */
  onSuccess?: (response: AxiosResponse) => void;
  /**
   * Called when backend returns 422 validation errors or other error.
   * Receives the normalized errors map.
   */
  onError?: (errors: ValidationErrors, response?: AxiosResponse | any) => void;
  /**
   * Called when request finishes (success or error).
   */
  onFinish?: () => void;
};

export type UseApiReturn<T> = {
  data: T;
  initialData: T;
  setData: {
    /**
     * Set a single field by key.
     */
    <K extends keyof T>(key: K, value: T[K]): void;
    /**
     * Replace entire form data.
     */
    (updater: (current: T) => T): void;
  };
  /**
   * Reset all fields to initial values, or selected fields if provided.
   */
  reset: (...fields: (keyof T)[]) => void;
  /**
   * Set all fields back to provided object (does not change initialData).
   */
  replace: (values: Partial<T>) => void;
  /**
   * Whether the form values differ from the initial values.
   */
  isDirty: boolean;
  /**
   * Laravel-style errors map.
   */
  errors: ValidationErrors;
  /**
   * True if there is at least one error.
   */
  hasErrors: boolean;
  /**
   * Set a specific field error.
   */
  setError: (field: string, message: string | string[]) => void;
  /**
   * Merge multiple errors.
   */
  setErrors: (errors: ValidationErrors) => void;
  /**
   * Clear errors: all or by field names.
   */
  clearErrors: (...fields: string[]) => void;
  /**
   * True while request is in-flight.
   */
  processing: boolean;
  /**
   * Upload progress percentage (0-100). null if not uploading.
   */
  progress: number | null;
  /**
   * Goes true briefly after a successful submit.
   */
  recentlySuccessful: boolean;
  /**
   * Abort the active request (if any).
   */
  cancel: () => void;
  /**
   * Submit using a specific HTTP method.
   */
  submit: (
    method: Method,
    url: string,
    options?: SubmitOptions<T>
  ) => Promise<void>;
  get: (url: string, options?: SubmitOptions<T>) => Promise<void>;
  post: (url: string, options?: SubmitOptions<T>) => Promise<void>;
  put: (url: string, options?: SubmitOptions<T>) => Promise<void>;
  patch: (url: string, options?: SubmitOptions<T>) => Promise<void>;
  delete: (url: string, options?: SubmitOptions<T>) => Promise<void>;
  /**
   * Change (or set) the transform function at runtime.
   */
  transform: (fn: (data: T) => any) => void;
};

function isFileLike(value: any): boolean {
  // React Native file object is usually { uri, name, type }
  if (!value || typeof value !== "object") return false;
  return (
    typeof (value as any).uri === "string" &&
    typeof (value as any).name === "string" &&
    typeof (value as any).type === "string"
  );
}

function hasFiles(obj: any): boolean {
  if (!obj || typeof obj !== "object") return false;
  if (isFileLike(obj)) return true;
  if (Array.isArray(obj)) return obj.some(hasFiles);
  return Object.values(obj).some(hasFiles);
}

function objectToFormData(
  data: any,
  form?: FormData,
  parentKey?: string
): FormData {
  const fd = form || new FormData();
  if (data === null || data === undefined) {
    if (parentKey) fd.append(parentKey, "");
    return fd;
  }

  if (isFileLike(data)) {
    fd.append(parentKey || "file", data as any);
    return fd;
  }

  if (typeof data === "object" && !Array.isArray(data)) {
    Object.entries(data).forEach(([key, value]) => {
      const nextKey = parentKey ? `${parentKey}[${key}]` : key;
      objectToFormData(value, fd, nextKey);
    });
    return fd;
  }

  if (Array.isArray(data)) {
    data.forEach((value, index) => {
      const nextKey = parentKey ? `${parentKey}[${index}]` : String(index);
      objectToFormData(value, fd, nextKey);
    });
    return fd;
  }

  // primitive
  if (parentKey) {
    fd.append(parentKey, String(data));
  }
  return fd;
}

function deepEqual(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!bKeys.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

function useApi<T extends Record<string, any>>(
  initialValues: T,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const {
    autoCancel = true,
    resetOnSuccess = false,
    recentlySuccessfulTimeout = 2000,
    axiosInstance,
    forceFormData,
    transform: initialTransform,
  } = options;

  const ax = useMemo(() => axiosInstance ?? libApi, [axiosInstance]);

  const [data, setDataState] = useState<T>({ ...initialValues });
  const [initialData] = useState<T>({ ...initialValues });

  const [errors, setErrorsState] = useState<ValidationErrors>({});
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [recentlySuccessful, setRecentlySuccessful] = useState(false);

  const transformRef = useRef<(d: T) => any | undefined>(initialTransform);
  const abortRef = useRef<AbortController | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDirty = useMemo(
    () => !deepEqual(data, initialData),
    [data, initialData]
  );
  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  useEffect(() => {
    return () => {
      // cleanup pending request / timers on unmount
      if (abortRef.current) abortRef.current.abort();
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  const setData = useCallback(
    <K extends keyof T>(
      keyOrUpdater: K | ((current: T) => T),
      value?: T[K]
    ) => {
      setDataState((prev) => {
        if (typeof keyOrUpdater === "function") {
          return (keyOrUpdater as (c: T) => T)(prev);
        } else {
          return { ...prev, [keyOrUpdater]: value as T[K] };
        }
      });
    },
    []
  );

  const replace = useCallback((values: Partial<T>) => {
    setDataState((prev) => ({ ...prev, ...values }));
  }, []);

  const reset = useCallback(
    (...fields: (keyof T)[]) => {
      if (fields.length === 0) {
        setDataState({ ...initialData });
        return;
      }
      setDataState((prev) => {
        const next = { ...prev };
        fields.forEach((f) => {
          (next as any)[f] = (initialData as any)[f];
        });
        return next;
      });
    },
    [initialData]
  );

  const clearErrors = useCallback((...fields: string[]) => {
    if (fields.length === 0) {
      setErrorsState({});
      return;
    }
    setErrorsState((prev) => {
      const next = { ...prev };
      fields.forEach((f) => delete (next as any)[f]);
      return next;
    });
  }, []);

  const setError = useCallback((field: string, message: string | string[]) => {
    setErrorsState((prev) => ({ ...prev, [field]: message }));
  }, []);

  const setErrors = useCallback((errs: ValidationErrors) => {
    setErrorsState((prev) => ({ ...prev, ...errs }));
  }, []);

  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const toPayload = useCallback(
    (values: T) => {
      const transformed = transformRef.current
        ? transformRef.current(values)
        : values;
      const mustFormData = forceFormData || hasFiles(transformed);
      if (mustFormData) {
        return objectToFormData(transformed);
      }
      return transformed;
    },
    [forceFormData]
  );

  const submit = useCallback(
    async (
      method: Method,
      url: string,
      submitOptions: SubmitOptions<T> = {}
    ) => {
      const { config, onBefore, onStart, onProgress, onSuccess, onFinish } =
        submitOptions;

      try {
        if (onBefore) {
          const res = onBefore(data);
          if (res === false) return;
        }

        // Cancel previous if needed
        if (autoCancel) cancel();

        setProcessing(true);
        setProgress(null);
        if (onStart) onStart();
        clearErrors();

        const controller = new AbortController();
        abortRef.current = controller;

        const payload = toPayload(data);
        const requestConfig: AxiosRequestConfig = {
          method,
          url,
          data: ["get", "delete"].includes(method) ? undefined : payload,
          params: ["get", "delete"].includes(method)
            ? (payload as any)
            : undefined,
          signal: controller.signal,
          onUploadProgress: (evt) => {
            if (!evt.total) return;
            const percent = Math.round((evt.loaded / evt.total) * 100);
            setProgress(percent);
            if (onProgress) onProgress(percent);
          },
          ...config,
        };

        const response = await ax.request(requestConfig);

        setErrorsState({});
        setRecentlySuccessful(true);
        if (successTimer.current) clearTimeout(successTimer.current);
        successTimer.current = setTimeout(
          () => setRecentlySuccessful(false),
          recentlySuccessfulTimeout
        );

        if (resetOnSuccess) {
          setDataState({ ...initialData });
        }

        if (onSuccess) onSuccess(response);
      } catch (error: any) {
        if (isCancel(error)) {
          // aborted — do nothing special
        } else if (error?.response?.status === 422) {
          // Laravel validation error
          const e = normalizeLaravelErrors(error.response?.data);
          setErrorsState(e);
          if (submitOptions.onError) submitOptions.onError(e, error.response);
        } else {
          // Other error — still surface via onError with best-effort map
          const e = normalizeLaravelErrors(error?.response?.data);
          setErrorsState(e);
          if (submitOptions.onError) submitOptions.onError(e, error?.response);
        }
      } finally {
        setProcessing(false);
        setProgress(null);
        abortRef.current = null;
        if (onFinish) onFinish();
      }
    },
    [
      ax,
      autoCancel,
      cancel,
      clearErrors,
      data,
      initialData,
      recentlySuccessfulTimeout,
      resetOnSuccess,
      toPayload,
    ]
  );

  const api = useMemo<UseApiReturn<T>>(
    () => ({
      data,
      initialData,
      setData,
      reset,
      replace,
      isDirty,
      errors,
      hasErrors,
      setError,
      setErrors,
      clearErrors,
      processing,
      progress,
      recentlySuccessful,
      cancel,
      submit,
      get: (url, opts) => submit("get", url, opts),
      post: (url, opts) => submit("post", url, opts),
      put: (url, opts) => submit("put", url, opts),
      patch: (url, opts) => submit("patch", url, opts),
      delete: (url, opts) => submit("delete", url, opts),
      transform: (fn) => {
        transformRef.current = fn;
      },
    }),
    [
      cancel,
      clearErrors,
      data,
      errors,
      hasErrors,
      initialData,
      isDirty,
      processing,
      progress,
      recentlySuccessful,
      reset,
      replace,
      setData,
      setError,
      setErrors,
      submit,
    ]
  );

  return api;
}

function normalizeLaravelErrors(payload: any): ValidationErrors {
  const out: ValidationErrors = {};

  if (!payload) return out;

  const bag = payload.errors ?? payload;

  if (typeof bag === "string") {
    out["error"] = bag;
    return out;
  }

  if (typeof bag !== "object") return out;

  for (const [key, val] of Object.entries(bag)) {
    if (Array.isArray(val)) {
      out[key] = val.map(String);
    } else if (typeof val === "string") {
      out[key] = val;
    } else if (val && typeof val === "object" && "message" in val) {
      out[key] = String((val as any).message);
    }
  }
  return out;
}

export default useApi;
