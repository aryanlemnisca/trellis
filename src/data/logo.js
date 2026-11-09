/* Logo URL respects the deploy base path (dev serves at /, prod may not). */
export default import.meta.env.BASE_URL.replace(/\/$/, '') + '/trellis-logo.png';
