// ============================================
// BacktestPro — File System Access API Wrapper
// ============================================

export async function pickDirectory(): Promise<FileSystemDirectoryHandle> {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    return handle;
}

async function getOrCreateSubDir(
    parent: FileSystemDirectoryHandle,
    name: string
): Promise<FileSystemDirectoryHandle> {
    return parent.getDirectoryHandle(name, { create: true });
}

// --- Save / Read JSON config files ---

export async function saveJSON(
    dir: FileSystemDirectoryHandle,
    fileName: string,
    data: unknown
): Promise<void> {
    const handle = await dir.getFileHandle(fileName, { create: true });
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
}

export async function readJSON<T>(
    dir: FileSystemDirectoryHandle,
    fileName: string
): Promise<T | null> {
    try {
        const handle = await dir.getFileHandle(fileName);
        const file = await handle.getFile();
        const text = await file.text();
        return JSON.parse(text) as T;
    } catch {
        return null;
    }
}

// --- Chart Image Operations ---

export function buildFileName(
    template: string,
    data: {
        symbol: string;
        timeframe: string;
        session: string;
        date: string;
        outcome?: string;
        setupName?: string;
        project?: string;
        theme?: string;
    }
): string {
    let name = template
        .replace('{symbol}', data.symbol || 'Unknown')
        .replace('{timeframe}', data.timeframe || 'Unknown')
        .replace('{session}', (data.session || 'Unknown').replace(/\s+/g, ''))
        .replace('{date}', data.date || new Date().toISOString().split('T')[0])
        .replace('{outcome}', data.outcome || 'Pending')
        .replace('{setup}', (data.setupName || '').replace(/\s+/g, '-') || 'Setup')
        .replace('{project}', (data.project || 'General').replace(/\s+/g, '-'))
        .replace('{theme}', (data.theme || 'Global').replace(/\s+/g, '-'));

    // sanitize
    name = name.replace(/[<>:"/\\|?*]/g, '_');
    return name;
}

export async function saveChartImage(
    dir: FileSystemDirectoryHandle,
    fileName: string,
    blob: Blob
): Promise<void> {
    const chartsDir = await getOrCreateSubDir(dir, 'charts');
    const handle = await chartsDir.getFileHandle(fileName, { create: true });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
}

export async function saveChartMetadata(
    dir: FileSystemDirectoryHandle,
    imageFileName: string,
    metadata: Record<string, unknown>
): Promise<void> {
    const chartsDir = await getOrCreateSubDir(dir, 'charts');
    const jsonName = imageFileName.replace(/\.[^.]+$/, '.json');
    const handle = await chartsDir.getFileHandle(jsonName, { create: true });
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(metadata, null, 2));
    await writable.close();
}

export async function readChartImage(
    dir: FileSystemDirectoryHandle,
    fileName: string
): Promise<string | null> {
    try {
        const chartsDir = await getOrCreateSubDir(dir, 'charts');
        const handle = await chartsDir.getFileHandle(fileName);
        const file = await handle.getFile();
        return URL.createObjectURL(file);
    } catch {
        return null;
    }
}

export async function deleteChartFiles(
    dir: FileSystemDirectoryHandle,
    imageFileName: string
): Promise<void> {
    const chartsDir = await getOrCreateSubDir(dir, 'charts');
    try {
        await chartsDir.removeEntry(imageFileName);
    } catch { /* file might not exist */ }
    try {
        const jsonName = imageFileName.replace(/\.[^.]+$/, '.json');
        await chartsDir.removeEntry(jsonName);
    } catch { /* file might not exist */ }
}

// --- Load all charts from folder ---

export async function loadAllChartMetadata(
    dir: FileSystemDirectoryHandle
): Promise<Record<string, unknown>[]> {
    const chartsDir = await getOrCreateSubDir(dir, 'charts');
    const metadata: Record<string, unknown>[] = [];

    for await (const entry of chartsDir.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.json')) {
            try {
                const file = await entry.getFile();
                const text = await file.text();
                metadata.push(JSON.parse(text));
            } catch { /* skip corrupted files */ }
        }
    }

    return metadata;
}

// --- Generate thumbnail from image ---

export async function generateThumbnail(
    blob: Blob,
    maxWidth: number = 400
): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ratio = maxWidth / img.width;
            canvas.width = maxWidth;
            canvas.height = img.height * ratio;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/webp', 0.7));
        };
        img.src = url;
    });
}

// --- Export / Import ---

export async function exportAsZip(
    dir: FileSystemDirectoryHandle
): Promise<Blob> {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Add root config files
    for (const name of ['config.json', 'projects.json', 'timer-sessions.json']) {
        try {
            const handle = await dir.getFileHandle(name);
            const file = await handle.getFile();
            zip.file(name, await file.arrayBuffer());
        } catch { /* skip if doesn't exist */ }
    }

    // Add charts folder
    const chartsDir = await getOrCreateSubDir(dir, 'charts');
    const chartsFolder = zip.folder('charts')!;
    for await (const entry of chartsDir.values()) {
        if (entry.kind === 'file') {
            const file = await entry.getFile();
            chartsFolder.file(entry.name, await file.arrayBuffer());
        }
    }

    return zip.generateAsync({ type: 'blob' });
}

export async function importFromZip(
    dir: FileSystemDirectoryHandle,
    zipBlob: Blob
): Promise<number> {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(zipBlob);
    let count = 0;

    for (const [path, entry] of Object.entries(zip.files)) {
        if (entry.dir) continue;
        const data = await entry.async('arraybuffer');

        if (path.startsWith('charts/')) {
            const chartsDir = await getOrCreateSubDir(dir, 'charts');
            const fileName = path.replace('charts/', '');
            const handle = await chartsDir.getFileHandle(fileName, { create: true });
            const writable = await handle.createWritable();
            await writable.write(data);
            await writable.close();
            if (!fileName.endsWith('.json')) count++;
        } else {
            const handle = await dir.getFileHandle(path, { create: true });
            const writable = await handle.createWritable();
            await writable.write(data);
            await writable.close();
        }
    }

    return count;
}
