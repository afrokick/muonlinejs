import { castToByte, integerDevision, castToUInt, castToUShort, getPacketHeaderSize, getPacketSize, setPacketSize, ArrayCopy } from "../utils";

class SimpleModulusKeys {
  public ModulusKey: number[] = [0, 0, 0, 0];
  public XorKey: number[] = [0, 0, 0, 0];
  public EncryptKey: number[] = [0, 0, 0, 0];
  public DecryptKey: number[] = [0, 0, 0, 0];

  public static CreateDecryptionKeys(decryptionKey: number[]): SimpleModulusKeys {
    var keys = new SimpleModulusKeys();
    keys.ModulusKey[0] = decryptionKey[0];
    keys.ModulusKey[1] = decryptionKey[1];
    keys.ModulusKey[2] = decryptionKey[2];
    keys.ModulusKey[3] = decryptionKey[3];
    keys.DecryptKey[0] = decryptionKey[4];
    keys.DecryptKey[1] = decryptionKey[5];
    keys.DecryptKey[2] = decryptionKey[6];
    keys.DecryptKey[3] = decryptionKey[7];
    keys.XorKey[0] = decryptionKey[8];
    keys.XorKey[1] = decryptionKey[9];
    keys.XorKey[2] = decryptionKey[10];
    keys.XorKey[3] = decryptionKey[11];
    return keys;
  }

  public static CreateEncryptionKeys(encryptionKey: number[]): SimpleModulusKeys {
    var keys = new SimpleModulusKeys();
    keys.ModulusKey[0] = encryptionKey[0];
    keys.ModulusKey[1] = encryptionKey[1];
    keys.ModulusKey[2] = encryptionKey[2];
    keys.ModulusKey[3] = encryptionKey[3];
    keys.EncryptKey[0] = encryptionKey[4];
    keys.EncryptKey[1] = encryptionKey[5];
    keys.EncryptKey[2] = encryptionKey[6];
    keys.EncryptKey[3] = encryptionKey[7];
    keys.XorKey[0] = encryptionKey[8];
    keys.XorKey[1] = encryptionKey[9];
    keys.XorKey[2] = encryptionKey[10];
    keys.XorKey[3] = encryptionKey[11];
    return keys;
  }

  public GetEncryptionKeys(): number[] {
    return [...this.ModulusKey, ...this.EncryptKey, ...this.XorKey];
  }

  public GetDecryptionKeys(): number[] {
    return [...this.ModulusKey, ...this.DecryptKey, ...this.XorKey];
  }
}

const DecryptedBlockSize: Int = 8;
const EncryptedBlockSize: Int = 11;
const BlockSizeXorKey: Byte = 0x3D;
const BlockCheckSumXorKey: Byte = 0xF8;

function BufferBlockCopy<TSourceArray extends Uint8Array | Uint16Array | Uint32Array, TDestArray extends Uint8Array | Uint16Array | Uint32Array>(buffer: TSourceArray, srcOffset: Int, dst: TDestArray, dstOffset: Int, bytesCount: Int): void {
  if (buffer.BYTES_PER_ELEMENT === dst.BYTES_PER_ELEMENT) {
    for (let i = 0; i < bytesCount; i++) {
      dst[dstOffset + i] = buffer[srcOffset + i];
    }
  } else {
    const s = new DataView(buffer.buffer);
    const d = new DataView(dst.buffer);

    for (let i = 0; i < bytesCount; i++) {
      d.setUint8(dstOffset + i, s.getUint8(srcOffset + i));
    }
  }
}

function ArrayClear<TArray extends Uint8Array | Uint16Array>(buffer: TArray, index: Int, length: Int): void {
  for (let i = 0; i < length; i++) {
    buffer[index + i] = 0;
  }
}

function ArrayResize<TArray extends Uint8Array>(buffer: TArray, newSize: Int) {
  if (buffer.byteLength <= newSize) {
    return buffer.slice(0, newSize);
  }

  const newBuffer = new Uint8Array(newSize);

  for (let i = 0; i < buffer.length; i++) {
    newBuffer[i] = buffer[i];
  }

  return newBuffer;
}

class Counter {
  Count = 0;
  Reset(): void {
    this.Count = 0;
  }

  Increase() {
    this.Count++;
  }
}

class SimpleModulusBase {
  Counter = new Counter();

  DecryptedBlockBuffer = new Uint8Array(DecryptedBlockSize);
  EncryptedBlockBuffer = new Uint8Array(EncryptedBlockSize);

  RingBuffer = new Uint32Array(4);
  ShiftBuffer = new Uint8Array(4);
  CryptBuffer = new Uint16Array(4);

  Reset(): void {
    this.Counter.Reset();
  }

  InternalShiftBytes(outputBuffer: Uint8Array, outputOffset: Int, shiftArray: Uint8Array, shiftOffset: Int, size: Int): void {
    shiftOffset &= 0x7;

    SimpleModulusBase.ShiftRight(shiftArray, size, shiftOffset);
    SimpleModulusBase.ShiftLeft(shiftArray, size + 1, outputOffset & 0x7);

    if ((outputOffset & 0x7) > shiftOffset) {
      size++;
    }

    const offset = integerDevision(outputOffset / DecryptedBlockSize);
    for (let i = 0; i < size; i++) {
      outputBuffer[i + offset] |= shiftArray[i];
    }
  }

  GetContentSize(packet: Uint8Array, decrypted: boolean): Int {
    return getPacketSize(packet) - getPacketHeaderSize(packet) + (decrypted ? 1 : 0);
  }

  GetShiftSize(length: Int, shiftOffset: Int): Int {
    return integerDevision((length + shiftOffset - 1) / DecryptedBlockSize) + (1 - integerDevision(shiftOffset / DecryptedBlockSize));
  }

  ClearShiftBuffer(): void {
    this.ShiftBuffer[0] = 0;
    this.ShiftBuffer[1] = 0;
    this.ShiftBuffer[2] = 0;
    this.ShiftBuffer[3] = 0;
  }

  static ShiftLeft(data: Uint8Array, size: Int, shift: Int): void {
    if (shift === 0) {
      return;
    }

    for (let i = 1; i < size; i++) {
      data[size - i] = castToByte((data[size - i] >> shift) | (data[size - i - 1] << (8 - shift)));
    }

    data[0] >>= shift;
  }

  static ShiftRight(data: Uint8Array, size: Int, shift: Int): void {
    if (shift === 0) {
      return;
    }

    for (let i = 1; i < size; i++) {
      data[i - 1] = castToByte((data[i - 1] << shift) | (data[i] >> (8 - shift)));
    }

    data[size - 1] <<= shift;
  }
}

export class SimpleModulusEncryptor extends SimpleModulusBase {
  static DefaultServerKey = SimpleModulusKeys.CreateEncryptionKeys([73326, 109989, 98843, 171058, 13169, 19036, 35482, 29587, 62004, 64409, 35374, 64599]);
  static DefaultClientKey = SimpleModulusKeys.CreateEncryptionKeys([128079, 164742, 70235, 106898, 23489, 11911, 19816, 13647, 48413, 46165, 15171, 37433]);

  encryptionKeys: SimpleModulusKeys;

  constructor() {
    super();
    this.encryptionKeys = SimpleModulusEncryptor.DefaultServerKey;
  }

  Encrypt(packet: Uint8Array): Uint8Array {
    if (packet[0] < 0xC3) {
      return packet;
    }

    const result = this.EncryptC3(packet);
    this.Counter.Increase();
    return result;
  }

  private static CopyIntToArray(targetArray: Uint8Array, value: UInt, valueOffset: Int, size: Int): void {
    let targetIndex = 0;
    for (let i = valueOffset; i < valueOffset + size; i++) {
      targetArray[targetIndex] = castToByte((value >> (8 * i)) & 0xFF);
      targetIndex++;
    }
  }

  private EncryptC3(data: Uint8Array): Uint8Array {
    const headerSize = getPacketHeaderSize(data);
    const contentSize = this.GetContentSize(data, true);
    const contents = new Uint8Array(contentSize);
    contents[0] = castToByte(this.Counter.Count);
    BufferBlockCopy(data, headerSize, contents, 1, contentSize - 1);
    const result = new Uint8Array(this.GetEncryptedSize(data));
    this.EncodeBuffer(contents, headerSize, contentSize, result);
    result[0] = data[0];
    setPacketSize(result);

    return result;
  }

  GetEncryptedSize(data: Uint8Array): Int {
    const contentSize = this.GetContentSize(data, true);
    return ((integerDevision(contentSize / DecryptedBlockSize) + (((contentSize % DecryptedBlockSize) > 0) ? 1 : 0)) * EncryptedBlockSize) + getPacketHeaderSize(data);
  }

  EncodeBuffer(inputBuffer: Uint8Array, offset: Int, size: Int, result: Uint8Array): void {
    let i = 0;
    let sizeCounter = 0;
    while (i < size) {
      ArrayClear(this.EncryptedBlockBuffer, 0, this.EncryptedBlockBuffer.byteLength);
      if (i + DecryptedBlockSize < size) {
        BufferBlockCopy(inputBuffer, i, this.DecryptedBlockBuffer, 0, DecryptedBlockSize);
        this.BlockEncode(this.EncryptedBlockBuffer, this.DecryptedBlockBuffer, DecryptedBlockSize);
      }
      else {
        BufferBlockCopy(inputBuffer, i, this.DecryptedBlockBuffer, 0, size - i);
        this.BlockEncode(this.EncryptedBlockBuffer, this.DecryptedBlockBuffer, size - i);
      }

      BufferBlockCopy(this.EncryptedBlockBuffer, 0, result, offset + sizeCounter, EncryptedBlockSize);
      i += DecryptedBlockSize;
      sizeCounter += EncryptedBlockSize;
    }
  }

  BlockEncode(outputBuffer: Uint8Array, inputBuffer: Uint8Array, blockSize: Int): void {
    this.SetRingBuffer(inputBuffer, blockSize);
    this.ShiftBytes(outputBuffer, 0x00, this.RingBuffer[0], 0x00, 0x10);
    this.ShiftBytes(outputBuffer, 0x10, this.RingBuffer[0], 0x16, 0x02);
    this.ShiftBytes(outputBuffer, 0x12, this.RingBuffer[1], 0x00, 0x10);
    this.ShiftBytes(outputBuffer, 0x22, this.RingBuffer[1], 0x16, 0x02);
    this.ShiftBytes(outputBuffer, 0x24, this.RingBuffer[2], 0x00, 0x10);
    this.ShiftBytes(outputBuffer, 0x34, this.RingBuffer[2], 0x16, 0x02);
    this.ShiftBytes(outputBuffer, 0x36, this.RingBuffer[3], 0x00, 0x10);
    this.ShiftBytes(outputBuffer, 0x46, this.RingBuffer[3], 0x16, 0x02);
    this.EncodeFinal(blockSize, inputBuffer, outputBuffer);
  }

  EncodeFinal(blockSize: Int, inputBuffer: Uint8Array, outputBuffer: Uint8Array): void {
    let size: Byte = castToByte(blockSize ^ BlockSizeXorKey);
    let checksum: Byte = BlockCheckSumXorKey;
    for (let i = 0; i < blockSize; i++) {
      checksum ^= inputBuffer[i];
    }

    size ^= checksum;

    this.ShiftBytes(outputBuffer, 0x48, castToUInt(checksum << 8 | size), 0x00, 0x10);
  }

  SetRingBuffer(inputBuffer: Uint8Array, blockSize: Int): void {
    const keys = this.encryptionKeys;
    const halfBlockSize = integerDevision(blockSize / 2);
    ArrayClear(this.CryptBuffer, halfBlockSize, this.CryptBuffer.length - halfBlockSize); // we don't need to clear the whole array since parts are getting overriden by the input buffer
    BufferBlockCopy(inputBuffer, 0, this.CryptBuffer, 0, blockSize);
    this.RingBuffer[0] = ((keys.XorKey[0] ^ this.CryptBuffer[0]) * keys.EncryptKey[0]) % keys.ModulusKey[0];
    this.RingBuffer[1] = ((keys.XorKey[1] ^ (this.CryptBuffer[1] ^ (this.RingBuffer[0] & 0xFFFF))) * keys.EncryptKey[1]) % keys.ModulusKey[1];
    this.RingBuffer[2] = ((keys.XorKey[2] ^ (this.CryptBuffer[2] ^ (this.RingBuffer[1] & 0xFFFF))) * keys.EncryptKey[2]) % keys.ModulusKey[2];
    this.RingBuffer[3] = ((keys.XorKey[3] ^ (this.CryptBuffer[3] ^ (this.RingBuffer[2] & 0xFFFF))) * keys.EncryptKey[3]) % keys.ModulusKey[3];
    BufferBlockCopy(this.CryptBuffer, 0, inputBuffer, 0, blockSize);
    this.RingBuffer[0] = this.RingBuffer[0] ^ keys.XorKey[0] ^ (this.RingBuffer[1] & 0xFFFF);
    this.RingBuffer[1] = this.RingBuffer[1] ^ keys.XorKey[1] ^ (this.RingBuffer[2] & 0xFFFF);
    this.RingBuffer[2] = this.RingBuffer[2] ^ keys.XorKey[2] ^ (this.RingBuffer[3] & 0xFFFF);
  }

  ShiftBytes(outputBuffer: Uint8Array, outputOffset: Int, shift: UInt, shiftOffset: Int, length: Int): void {
    const size: Int = this.GetShiftSize(length, shiftOffset);
    this.ShiftBuffer[2] = 0; // the first two bytes will be set at the next statement
    SimpleModulusEncryptor.CopyIntToArray(this.ShiftBuffer, shift, integerDevision(shiftOffset / DecryptedBlockSize), size);
    this.InternalShiftBytes(outputBuffer, outputOffset, this.ShiftBuffer, shiftOffset, size);
  }
}

export class SimpleModulusDecryptor extends SimpleModulusBase {
  static DefaultServerKey = SimpleModulusKeys.CreateDecryptionKeys([128079, 164742, 70235, 106898, 31544, 2047, 57011, 10183, 48413, 46165, 15171, 37433]);
  static DefaultClientKey = SimpleModulusKeys.CreateDecryptionKeys([73326, 109989, 98843, 171058, 18035, 30340, 24701, 11141, 62004, 64409, 35374, 64599]);

  decryptionKeys = SimpleModulusDecryptor.DefaultServerKey;
  readonly shiftArray = new Uint8Array(4);

  public AcceptWrongBlockChecksum = true;

  Decrypt(packet: Uint8Array): [boolean, Uint8Array] {
    if (packet[0] < 0xC3) {
      return [true, packet];
    }

    const r = this.DecryptC3(packet);

    const result: boolean = this.Counter.Count === r[0];

    this.Counter.Increase();

    return [result, r[1]];
  }

  private DecryptC3(data: Uint8Array): [Byte, Uint8Array] {
    const contentSize = this.GetContentSize(data, false);
    const headerSize = getPacketHeaderSize(data);
    let result = new Uint8Array(this.GetMaximumDecryptedSize(data));
    let decryptedSize = this.DecodeBuffer(data, headerSize, contentSize, result);
    decryptedSize += headerSize - 1;
    const decryptedCount = result[headerSize - 1];
    result[0] = data[0];
    result = ArrayResize(result, decryptedSize);
    setPacketSize(result);

    return [decryptedCount, result];
  }

  private DecodeBuffer(inputBuffer: Uint8Array, offset: Int, size: Int, result: Uint8Array): Int {
    let sizeCounter: Int = 0;
    if ((size % EncryptedBlockSize) !== 0) {
      return sizeCounter;
    }

    for (let i = 0; i < size; i += EncryptedBlockSize) {
      BufferBlockCopy(inputBuffer, i + offset, this.EncryptedBlockBuffer, 0, EncryptedBlockSize);
      const blockSize = this.BlockDecode(this.DecryptedBlockBuffer, this.EncryptedBlockBuffer);
      if (blockSize != -1) {
        BufferBlockCopy(this.DecryptedBlockBuffer, 0, result, (offset - 1) + sizeCounter, blockSize);
        sizeCounter += blockSize;
      }
    }

    return sizeCounter;
  }

  BlockDecode(outputBuffer: Uint8Array, inputBuffer: Uint8Array): Int {
    this.ClearShiftBuffer();
    this.ShiftBytes(this.ShiftBuffer, 0x00, inputBuffer, 0x00, 0x10);
    this.ShiftBytes(this.ShiftBuffer, 0x16, inputBuffer, 0x10, 0x02);
    BufferBlockCopy(this.ShiftBuffer, 0, this.RingBuffer, 0, 4);
    this.ClearShiftBuffer();
    this.ShiftBytes(this.ShiftBuffer, 0x00, inputBuffer, 0x12, 0x10);
    this.ShiftBytes(this.ShiftBuffer, 0x16, inputBuffer, 0x22, 0x02);
    BufferBlockCopy(this.ShiftBuffer, 0, this.RingBuffer, 4, 4);
    this.ClearShiftBuffer();
    this.ShiftBytes(this.ShiftBuffer, 0x00, inputBuffer, 0x24, 0x10);
    this.ShiftBytes(this.ShiftBuffer, 0x16, inputBuffer, 0x34, 0x02);
    BufferBlockCopy(this.ShiftBuffer, 0, this.RingBuffer, 8, 4);
    this.ClearShiftBuffer();
    this.ShiftBytes(this.ShiftBuffer, 0x00, inputBuffer, 0x36, 0x10);
    this.ShiftBytes(this.ShiftBuffer, 0x16, inputBuffer, 0x46, 0x02);

    BufferBlockCopy(this.ShiftBuffer, 0, this.RingBuffer, 12, 4);
    var keys = this.decryptionKeys;
    this.RingBuffer[2] = this.RingBuffer[2] ^ keys.XorKey[2] ^ (this.RingBuffer[3] & 0xFFFF);
    this.RingBuffer[1] = this.RingBuffer[1] ^ keys.XorKey[1] ^ (this.RingBuffer[2] & 0xFFFF);
    this.RingBuffer[0] = this.RingBuffer[0] ^ keys.XorKey[0] ^ (this.RingBuffer[1] & 0xFFFF);

    this.CryptBuffer[0] = castToUShort(keys.XorKey[0] ^ ((this.RingBuffer[0] * keys.DecryptKey[0]) % keys.ModulusKey[0]));
    this.CryptBuffer[1] = castToUShort(keys.XorKey[1] ^ ((this.RingBuffer[1] * keys.DecryptKey[1]) % keys.ModulusKey[1]) ^ (this.RingBuffer[0] & 0xFFFF));
    this.CryptBuffer[2] = castToUShort(keys.XorKey[2] ^ ((this.RingBuffer[2] * keys.DecryptKey[2]) % keys.ModulusKey[2]) ^ (this.RingBuffer[1] & 0xFFFF));
    this.CryptBuffer[3] = castToUShort(keys.XorKey[3] ^ ((this.RingBuffer[3] * keys.DecryptKey[3]) % keys.ModulusKey[3]) ^ (this.RingBuffer[2] & 0xFFFF));

    return this.DecodeFinal(inputBuffer, outputBuffer);
  }

  private DecodeFinal(inputBuffer: Uint8Array, outputBuffer: Uint8Array): Int {
    this.ClearShiftBuffer();
    this.ShiftBytes(this.ShiftBuffer, 0x00, inputBuffer, 0x48, 0x10);

    // ShiftBuffer[0] -> block size (decrypted)
    // ShiftBuffer[1] -> checksum
    const blockSize: Byte = castToByte(this.ShiftBuffer[0] ^ this.ShiftBuffer[1] ^ BlockSizeXorKey);
    BufferBlockCopy(this.CryptBuffer, 0, outputBuffer, 0, blockSize);
    //         let checksum:Byte = BlockCheckSumXorKey;
    // for (let i = 0; i < blockSize; i++)
    // {
    //   checksum ^= outputBuffer[i];
    // }

    // if (this.ShiftBuffer[1] !== checksum) {
    //   if (!this.AcceptWrongBlockChecksum) {
    //     throw new Error(this.ShiftBuffer[1], checksum);
    //   }
    // }

    return blockSize;
  }

  private ShiftBytes(outputBuffer: Uint8Array, outputOffset: Int, inputBuffer: Uint8Array, shiftOffset: Int, length: Int): void {
    const size: Int = this.GetShiftSize(length, shiftOffset);
    this.shiftArray[1] = 0;
    this.shiftArray[2] = 0;
    this.shiftArray[3] = 0;

    ArrayCopy(inputBuffer, integerDevision(shiftOffset / DecryptedBlockSize), this.shiftArray, 0, size);

    var tempShift = (length + shiftOffset) & 0x7;
    if (tempShift != 0) {
      this.shiftArray[size - 1] = castToByte(this.shiftArray[size - 1] & 0xFF << (8 - tempShift));
    }

    this.InternalShiftBytes(outputBuffer, outputOffset, this.shiftArray, shiftOffset, size);
  }

  private GetMaximumDecryptedSize(packet: Uint8Array): Int {
    return (integerDevision(this.GetContentSize(packet, false) / EncryptedBlockSize) * DecryptedBlockSize) + getPacketHeaderSize(packet) - 1;
  }
}
