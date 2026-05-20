module.exports = (api) => {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        { jsxImportSource: 'nativewind', runtime: 'automatic' },
      ],
      'nativewind/babel',
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
          },
        },
      ],
    ],
  };
};
