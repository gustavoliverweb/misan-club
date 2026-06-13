"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/app/actions/profile-actions";
import type { CurrentUser } from "@/lib/current-user";

type ProfileFormProps = {
  profile: Pick<
    CurrentUser,
    | "fullName"
    | "phone"
    | "birthDate"
    | "address"
    | "city"
    | "country"
    | "postalCode"
    | "bio"
  >;
};

const inputClass =
  "w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-fg placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-50";

const labelClass = "block text-sm text-muted mb-1";

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateProfileAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-5">
      {/* Información personal */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-faint">
          Información personal
        </p>

        <div>
          <label htmlFor="fullName" className={labelClass}>
            Nombre completo <span className="text-accent">*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            defaultValue={profile.fullName}
            className={inputClass}
            placeholder="Tu nombre completo"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="phone" className={labelClass}>
              Teléfono
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={profile.phone ?? ""}
              className={inputClass}
              placeholder="+34 600 000 000"
            />
          </div>

          <div>
            <label htmlFor="birthDate" className={labelClass}>
              Fecha de nacimiento
            </label>
            <input
              id="birthDate"
              name="birthDate"
              type="date"
              defaultValue={profile.birthDate ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Dirección */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-faint">
          Dirección
        </p>

        <div>
          <label htmlFor="address" className={labelClass}>
            Calle y número
          </label>
          <input
            id="address"
            name="address"
            type="text"
            defaultValue={profile.address ?? ""}
            className={inputClass}
            placeholder="Calle Mayor, 1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="city" className={labelClass}>
              Ciudad
            </label>
            <input
              id="city"
              name="city"
              type="text"
              defaultValue={profile.city ?? ""}
              className={inputClass}
              placeholder="Madrid"
            />
          </div>

          <div>
            <label htmlFor="postalCode" className={labelClass}>
              Código postal
            </label>
            <input
              id="postalCode"
              name="postalCode"
              type="text"
              defaultValue={profile.postalCode ?? ""}
              className={inputClass}
              placeholder="28001"
            />
          </div>
        </div>

        <div>
          <label htmlFor="country" className={labelClass}>
            País
          </label>
          <input
            id="country"
            name="country"
            type="text"
            defaultValue={profile.country ?? ""}
            className={inputClass}
            placeholder="España"
          />
        </div>
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className={labelClass}>
          Sobre ti{" "}
          <span className="text-faint text-xs font-normal">(máx. 500 caracteres)</span>
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={500}
          defaultValue={profile.bio ?? ""}
          className={`${inputClass} resize-none`}
          placeholder="Una breve descripción sobre ti…"
        />
      </div>

      {/* Feedback */}
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">
          Perfil actualizado correctamente.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
