export const getInitial = (name: string | undefined | null): string => name ? name.charAt(0).toUpperCase() : '?';
