export abstract class BaseReader<T> {
  async load(path: string) {
    // if (!File.Exists(path))
    //     throw new FileNotFoundException($"File not found: {path}", path);
    // var buffer = await File.ReadAllBytesAsync(path);
    // return Read(buffer);
  }

  abstract read(buffer: Uint8Array): T;
}
