//AuthSelectors
import { createSelector } from 'reselect';

const selectAuth = (state) => state.auth.auth;
export const isAuthenticated = createSelector(
    [selectAuth],
    (auth) => !!auth.email
);


export const hasRole = (role) => createSelector(
    [selectAuth],
    (auth) => (auth.roles || []).includes(role)
);

export const hasAnyRole = createSelector(
    [selectAuth],
    (auth) => auth.roles && auth.roles.length > 0
);
