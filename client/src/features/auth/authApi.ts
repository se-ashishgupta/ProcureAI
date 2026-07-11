import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAuthDirectory } from "@/features/admin/adminSlice";
import type { User } from "@/types";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      queryFn: async ({ email, password }) => {
        const match = getAuthDirectory().find(
          (u) =>
            u.email.toLowerCase() === email.trim().toLowerCase() &&
            u.password === password,
        );

        if (!match) {
          return {
            error: { status: 401, data: "Invalid email or password." },
          };
        }

        const { password: _, ...user } = match;
        return {
          data: {
            user,
            token: `mock-token-${user.id}`,
          },
        };
      },
    }),
  }),
});

export const { useLoginMutation } = authApi;
