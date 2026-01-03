import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email tidak boleh kosong")
  .email("Format email tidak valid")
  .max(255, "Email maksimal 255 karakter");

export const passwordSchema = z
  .string()
  .min(1, "Password tidak boleh kosong")
  .min(8, "Password minimal 8 karakter")
  .max(128, "Password maksimal 128 karakter")
  .regex(/[a-zA-Z]/, "Password harus mengandung huruf")
  .regex(/[0-9]/, "Password harus mengandung angka");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password tidak boleh kosong"),
});

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: z
    .string()
    .trim()
    .min(1, "Nama lengkap tidak boleh kosong")
    .max(100, "Nama maksimal 100 karakter"),
  role: z.enum(["admin_provinsi", "admin_kab_kota", "panitia", "wasit", "evaluator"]),
  kabupaten_kota_id: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type CreateUserFormData = z.infer<typeof createUserSchema>;
