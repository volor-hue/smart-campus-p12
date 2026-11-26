module.exports = {
  flowFile: 'flows.json',
  flowFilePretty: true,
  userDir: '/workspace/p12/low-code/data',
  uiHost: '127.0.0.1',
  uiPort: 1880,
  httpAdminRoot: '/',
  httpNodeRoot: '/',
  credentialSecret: false,
  functionGlobalContext: {},
  logging: {
    console: { level: 'info', metrics: false, audit: false },
  },
  editorTheme: {
    tours: false,
    header: { title: 'Smart Campus Practice #12' },
  },
  disableEditor: false,
};
