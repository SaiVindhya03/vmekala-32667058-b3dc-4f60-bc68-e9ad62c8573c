import { createAction, props } from '@ngrx/store';
import { UserDto } from '@vmekala/data';

// Login
export const login = createAction(
  '[Auth] Login',
  props<{ email: string; password: string }>()
);
export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: UserDto; token: string }>()
);
export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

// Logout
export const logout = createAction('[Auth] Logout');
export const logoutSuccess = createAction('[Auth] Logout Success');

// Load Current User
export const loadCurrentUser = createAction('[Auth] Load Current User');
export const loadCurrentUserSuccess = createAction(
  '[Auth] Load Current User Success',
  props<{ user: UserDto }>()
);
export const loadCurrentUserFailure = createAction(
  '[Auth] Load Current User Failure',
  props<{ error: string }>()
);

// Check Auth
export const checkAuth = createAction('[Auth] Check Auth');
export const setAuthenticated = createAction(
  '[Auth] Set Authenticated',
  props<{ user: UserDto; token: string }>()
);
export const setUnauthenticated = createAction('[Auth] Set Unauthenticated');
