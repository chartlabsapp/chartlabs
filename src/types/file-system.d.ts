// ============================================
// File System Access API — Type Declarations
// ============================================
// These APIs are available in Chromium browsers but don't have
// built-in TypeScript lib types yet.

interface FileSystemDirectoryHandle {
    values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>;
}

interface Window {
    showDirectoryPicker(options?: { mode?: 'read' | 'readwrite' }): Promise<FileSystemDirectoryHandle>;
}
