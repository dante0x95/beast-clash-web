import { useId, useState } from "react";

import { MONSTER_GALLERY } from "./monster.gallery";

import "./ImagePicker.css";

interface ImagePickerProps {
  readonly error: string | undefined;
  readonly onChange: (url: string) => void;
  readonly value: string;
}

export function ImagePicker({ error, onChange, value }: ImagePickerProps) {
  const id = useId();
  const inGallery = MONSTER_GALLERY.some((image) => image.url === value);
  const [useCustom, setUseCustom] = useState(!inGallery && value !== "");
  const errorId = `${id}-error`;

  return (
    <fieldset
      aria-describedby={error ? errorId : undefined}
      className="image-picker"
    >
      <legend className="form-label">Image</legend>

      <div className="image-picker__gallery">
        {MONSTER_GALLERY.map((image) => (
          <label className="image-picker__option" key={image.url}>
            <input
              checked={!useCustom && value === image.url}
              className="visually-hidden"
              name={`${id}-image`}
              onChange={() => {
                setUseCustom(false);
                onChange(image.url);
              }}
              type="radio"
              value={image.url}
            />
            <img
              alt={image.label}
              className="pixelated"
              height={64}
              loading="lazy"
              src={image.url}
              width={64}
            />
          </label>
        ))}
      </div>

      <label className="image-picker__custom-toggle">
        <input
          checked={useCustom}
          name={`${id}-image`}
          onChange={() => {
            setUseCustom(true);
            onChange("");
          }}
          type="radio"
        />
        Use my own image URL
      </label>

      {useCustom && (
        <input
          aria-invalid={error ? true : undefined}
          aria-label="Image URL"
          className="form-input"
          onChange={(event) => {
            onChange(event.target.value);
          }}
          placeholder="https://…"
          type="url"
          value={value}
        />
      )}

      {error && (
        <p className="form-error" id={errorId}>
          {error}
        </p>
      )}
    </fieldset>
  );
}
