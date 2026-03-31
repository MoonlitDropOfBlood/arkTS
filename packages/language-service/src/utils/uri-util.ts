import type { URI } from 'vscode-uri'

export namespace UriUtil {
  export function isContains<CompareFolderUri extends Partial<URI> & Pick<URI, 'fsPath' | 'toString' | 'path'>>(uriStr: string, compareFolderUri: CompareFolderUri): boolean {
    // Normalize URI to handle case sensitivity for drive letters and URL encoding
    const normalizedUriStr = normalizeUri(uriStr)
    const normalizedFsPath = normalizeUri(compareFolderUri.fsPath)
    const normalizedToString = normalizeUri(compareFolderUri.toString())
    const normalizedPath = normalizeUri(compareFolderUri.path)

    return normalizedUriStr.startsWith(normalizedFsPath)
      || normalizedUriStr.startsWith(normalizedToString)
      || normalizedUriStr.startsWith(normalizedPath)
  }

  /**
   * Normalize URI by handling URL decoding and drive letter case.
   * This handles:
   * - URL encoding (e.g., %3A → :)
   * - Case sensitivity for drive letters (e.g., d:/ vs D:/)
   */
  function normalizeUri(uri: string): string {
    // Decode URL encoding (e.g., %3A → :), but keep the file:// prefix intact
    let decoded = uri
    try {
      // Only decode if there are encoded characters
      if (uri.includes('%')) {
        decoded = decodeURIComponent(uri)
      }
    }
    catch {
      // If decoding fails, use original string
    }

    // Convert drive letter to uppercase (e.g., d:/ → D:/)
    return decoded.replace(/^(file:\/\/\/)?([a-z]):/i, (_match, protocol, drive) => {
      return `${protocol || ''}${drive.toUpperCase()}:`
    })
  }
}
