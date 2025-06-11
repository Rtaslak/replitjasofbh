export const isTestEnvironment = () =>
    import.meta.env.MODE === 'test';
  