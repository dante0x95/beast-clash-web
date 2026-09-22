import { useId, useState } from "react";

import { ApiError } from "../../api/api-error";
import { ImagePicker } from "./ImagePicker";
import {
  type CreateMonsterRequest,
  type MonsterField,
  type MonsterFieldErrors,
  type MonsterFormValues,
  toFieldErrors,
  validateMonsterForm,
} from "./monster.form";
import { MONSTER_LIMITS } from "./monster.limits";
import { MonsterCard } from "./MonsterCard";

import "./MonsterForm.css";

interface MonsterFormProps {
  readonly initialValues: MonsterFormValues;
  readonly isSubmitting: boolean;
  readonly onSubmit: (monster: CreateMonsterRequest) => Promise<unknown>;
  readonly submitLabel: string;
}

const STAT_FIELDS = [
  { field: "hp", label: "HP", limits: MONSTER_LIMITS.hp },
  { field: "attack", label: "Attack", limits: MONSTER_LIMITS.attack },
  { field: "defense", label: "Defense", limits: MONSTER_LIMITS.defense },
  { field: "speed", label: "Speed", limits: MONSTER_LIMITS.speed },
] as const;

function toPreviewNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
}

export function MonsterForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel,
}: MonsterFormProps) {
  const id = useId();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<MonsterFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const setField = (field: MonsterField, value: string): void => {
    setValues((current) => ({ ...current, [field]: value }));
    // the user is fixing it: stop showing the old message
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setFormError(null);

    const result = validateMonsterForm(values);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    try {
      await onSubmit(result.data);
    } catch (error) {
      if (error instanceof ApiError && error.issues.length > 0) {
        setErrors(toFieldErrors(error));
      }
      setFormError(
        error instanceof Error ? error.message : "Something went wrong",
      );
    }
  };

  const fieldProps = (field: MonsterField) => ({
    "aria-describedby": errors[field] ? `${id}-${field}-error` : undefined,
    "aria-invalid": errors[field] ? true : undefined,
    "className": "form-input",
    "id": `${id}-${field}`,
    "onChange": (event: React.ChangeEvent<HTMLInputElement>) => {
      setField(field, event.target.value);
    },
    "value": values[field],
  });

  const fieldError = (field: MonsterField) =>
    errors[field] && (
      <p className="form-error" id={`${id}-${field}-error`}>
        {errors[field]}
      </p>
    );

  return (
    <div className="monster-form">
      <form className="monster-form__fields" noValidate onSubmit={handleSubmit}>
        <div className="form-field">
          <label className="form-label" htmlFor={`${id}-name`}>
            Name
          </label>
          <input
            {...fieldProps("name")}
            autoComplete="off"
            maxLength={MONSTER_LIMITS.name.maxLength}
            type="text"
          />
          {fieldError("name")}
        </div>

        <div className="monster-form__stats">
          {STAT_FIELDS.map(({ field, label, limits }) => (
            <div className="form-field" key={field}>
              <label className="form-label" htmlFor={`${id}-${field}`}>
                {label}
              </label>
              <input
                {...fieldProps(field)}
                inputMode="numeric"
                max={limits.max}
                min={limits.min}
                step={1}
                type="number"
              />
              {fieldError(field)}
            </div>
          ))}
        </div>

        <ImagePicker
          error={errors.imageUrl}
          onChange={(url) => {
            setField("imageUrl", url);
          }}
          value={values.imageUrl}
        />

        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}

        <button className="button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
      </form>

      <aside aria-label="Preview" className="monster-form__preview">
        <h2 className="form-label">Preview</h2>
        <MonsterCard
          monster={{
            attack: toPreviewNumber(values.attack),
            createdAt: "",
            defense: toPreviewNumber(values.defense),
            hp: toPreviewNumber(values.hp),
            id: "preview",
            imageUrl: values.imageUrl,
            name: values.name.trim() || "???",
            speed: toPreviewNumber(values.speed),
            updatedAt: "",
          }}
        />
      </aside>
    </div>
  );
}
