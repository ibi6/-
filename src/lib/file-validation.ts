export interface CaptureFileLike {
  name: string
  size: number
}

export type CaptureFileValidation =
  | { valid: true }
  | {
      valid: false
      code: 'empty' | 'too_large' | 'pcapng' | 'unsupported'
      message: string
    }

/** 在上传前给出快速反馈；后端仍是文件安全校验的最终边界。 */
export function validateCaptureFile(
  file: CaptureFileLike,
  maxSizeMb = 512,
): CaptureFileValidation {
  const lowerName = file.name.trim().toLowerCase()
  if (file.size <= 0) {
    return { valid: false, code: 'empty', message: '文件为空，请选择有效的抓包文件。' }
  }
  if (lowerName.endsWith('.pcapng')) {
    return {
      valid: false,
      code: 'pcapng',
      message: '当前版本暂不解析 PCAPNG，请先在 Wireshark 中转换为经典 .pcap。',
    }
  }
  if (!lowerName.endsWith('.pcap') && !lowerName.endsWith('.cap')) {
    return { valid: false, code: 'unsupported', message: '仅支持经典 .pcap 或 .cap 文件。' }
  }
  const maxBytes = maxSizeMb * 1024 * 1024
  if (file.size > maxBytes) {
    return {
      valid: false,
      code: 'too_large',
      message: `文件超过 ${maxSizeMb} MB 上传限制，请拆分后重试。`,
    }
  }
  return { valid: true }
}
