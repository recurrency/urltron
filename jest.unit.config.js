// see https://jestjs.io/docs/configuration
module.exports = {
  roots: ['src'],
  moduleDirectories: ['node_modules'],
  transform: {
    '\\.[jt]sx?$': ['esbuild-jest', {sourcemap: true}],
  },
};
