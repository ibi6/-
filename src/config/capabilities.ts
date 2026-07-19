export const V1_PROTOCOLS = ['HTTP', 'HTTPS', 'TLS', 'DNS', 'TCP', 'UDP'] as const

export const PRODUCT_BOUNDARIES = {
  captureFormats: ['PCAP', 'CAP'],
  pcapng: false,
  authentication: false,
  parserEngine: 'Python 标准库 PCAP 引擎',
  databases: ['SQLite', 'MySQL'],
} as const
