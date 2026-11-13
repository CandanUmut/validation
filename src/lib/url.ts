/** Prefix a site path with the base (/validation/). Pass paths without a leading slash. */
export const u = (p = '') => import.meta.env.BASE_URL.replace(/\/?$/, '/') + p.replace(/^\//, '');
