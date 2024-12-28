export function transformImagePath(localPath: string, basePath: string = '', mediaRoot: string = 'http://localhost:8000/media/'): string {
  if (localPath.startsWith('http')) {
    return localPath;
  }
  // basePath があれば localPath から削除
  let relativePath = localPath;
    if (basePath && localPath.startsWith(basePath)) {
        relativePath = localPath.substring(basePath.length);
    }
  // mediaRoot と relativePath をって URL を構築
  return `${mediaRoot}${relativePath}`;
}