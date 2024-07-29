import type { BunFile, FileSink } from 'bun';

const PREDEFINED_ENUMS = new Set<string>(['CharacterClassNumber']);

let rewriter = new HTMLRewriter();
let file: BunFile = null as any;
let writer: FileSink = null as any;

// LeftShifted ?
// Structure, Enum(FruitUsage)
// <ItemCountField>CharacterCount</ItemCountField>
// <UseCustomIndexer>true</UseCustomIndexer>
type PacketFieldType =
  | "LongBigEndian"
  | "IntegerLittleEndian"
  | "IntegerBigEndian"
  | "Byte"
  | "Float"
  | "String"
  | "ShortLittleEndian"
  | "ShortBigEndian"
  | "Boolean" // how to encode/decode? 1 byte?
  | "Binary" // ?
  | "Enum"
  | "string";

type PacketHeaderType =
  | "C1Header"
  | "C2Header"
  | "C3Header"
  | "C4Header"
  | "C1HeaderWithSubCode"
  | "C2HeaderWithSubCode"
  | "C3HeaderWithSubCode"
  | "C4HeaderWithSubCode";

type Field = {
  index: number,
  type: PacketFieldType,
  name: string,
  typeName: string | undefined,
  length: number | undefined;
  description: string | undefined;
  leftShifted?: number;
  itemCountField?: string;
};

type Structure = {
  length: number | undefined;
  name: string;
  description: string;
  fields: Field[];
};

type EnumInfo = {
  name: string;
  description: string;
  values: EnumValue[];
};

type EnumValue = {
  name: string;
  description: string;
  value: number;
};

interface Packet {
  headerType: PacketHeaderType;
  code: number;
  subCode: number;
  name: string;
  length: number;
  direction: string;
  sentWhen: string;
  causedReaction: string;
  fields: Field[]; // index type name typename length
  structures: Structure[];
  enums: EnumInfo[];
}

let packet: Packet;
let packetsVarName: string;
const packets: Packet[] = [];
const globalEnums: Packet['enums'] = [];
const globalStructures: Structure[] = [];

const getLastStructure = () => packet.structures[packet.structures.length - 1];
const getLastEnum = () => packet.enums[packet.enums.length - 1];
const getLastField = () => packet.fields[packet.fields.length - 1];
const getLastFieldOfStructure = () => getLastStructure().fields[getLastStructure().fields.length - 1];
const getLastValueOfEnum = () => getLastEnum().values[getLastEnum().values.length - 1];

function parseAsText<T extends any>(obj: T, fieldName: keyof T): Required<Pick<HTMLRewriterTypes.HTMLRewriterElementContentHandlers, 'text'>> {
  return {
    text(text) {
      if (obj[fieldName] == null) {
        obj[fieldName] = "" as any;
      }

      obj[fieldName] += text.text as any;
      if (text.lastInTextNode) {
        obj[fieldName] = (obj[fieldName] as any).trim();
      }
    },
  };
}

function parseAsNumber<T extends any>(obj: T, fieldName: keyof T, hex?: boolean): Required<Pick<HTMLRewriterTypes.HTMLRewriterElementContentHandlers, 'text'>> {
  return {
    text(text) {
      if (obj[fieldName] == null) {
        obj[fieldName] = "" as any;
      }

      obj[fieldName] += text.text as any;
      if (text.lastInTextNode) {
        obj[fieldName] = parseInt((hex ? "0x" : "") + (obj[fieldName] as any).trim()) as any;
      }
    },
  };
}

const registerPacketTextField = (name: keyof Packet) => rewriter.on("packet > " + name.toLowerCase(), {
  text(text) {
    parseAsText(packet, name).text(text);
  }
});
const registerPacketNumberField = (name: keyof Packet, hex?: boolean) => rewriter.on("packet > " + name.toLowerCase(), {
  text(text) {
    parseAsNumber(packet, name, hex).text(text);
  }
});

function getReaderStringForType(type: PacketFieldType, index: string, bufferVarName: string, leftShifted: number, bytes?: number, length?: number): string {
  switch (type) {
    case "Boolean": {
      return `GetBoolean(${bufferVarName}.getUint8(${index}), ${leftShifted})`;
    }
    case "Byte": {
      if (length != null) {
        return `GetByteValue(${bufferVarName}.getUint8(${index}), ${length}, ${leftShifted})`; // little endian
      }
      return `${bufferVarName}.getUint8(${index})`;
    }
    //TODO LeftShifted
    case "ShortBigEndian": return `${bufferVarName}.getUint16(${index}, false)`;
    case "ShortLittleEndian": return `${bufferVarName}.getUint16(${index}, true)`;
    case "IntegerBigEndian": return `${bufferVarName}.getUint32(${index}, false)`;
    case "IntegerLittleEndian": return `${bufferVarName}.getUint32(${index}, true)`;
    case "LongBigEndian": return `${bufferVarName}.getBigUint64(${index}, false)`;
    case "Float": return `0.0`; // TODO how to parse float


    case "string":
    case "String": return `this._readString(${index}, ${index} + ${length ?? 0})`;

    case "Binary": return `this._readDataView(${index}, ${index} + ${(length != null ? Number(length) : 0)})`;
    case "Enum": {
      return `GetByteValue(${bufferVarName}.getUint8(${index}), ${length ?? 8}, ${leftShifted})`; // little endian
    }

    default: return `throw new Error(\`not implemented for type: ${type}\`)`;
  }
}

function getTypeSizeInBytes(type: PacketFieldType, count?: number): number {
  switch (type) {
    case "Boolean": return 1;
    case "Byte": return 1;
    case "ShortBigEndian":
    case "ShortLittleEndian": return 2;
    case "Float":
    case "IntegerBigEndian":
    case "IntegerLittleEndian": return 4;
    case "LongBigEndian": return 8;
    case "string":
    case "String": return count ?? 0; // 1 byte per symbol
    case "Binary": return count ?? 0;
    case "Enum": return 1;
    default: return `throw new Error(\`getTypeSizeInBytes not implemented for type: ${type}\`)` as any;
  }
}

function getSizeOfStructure(p: Packet, s: Structure): string | number {
  if (s.length != null) return s.length;

  const lastField = s.fields[s.fields.length - 1];
  const prevField = s.fields[s.fields.length - 2];

  if (lastField) {
    if (lastField.type.endsWith('[]')) {
      const prevSize = prevField.index + getTypeSizeInBytes(prevField.type, prevField.length);
      if (lastField.itemCountField) {
        const innerS = (p.structures.find(s => s.name === lastField.typeName) || globalStructures.find(s => s.name === lastField.typeName))!;

        return `${prevSize} + ${lastField.itemCountField} * ${getSizeOfStructure(p, innerS)}`;
        // return `${lastField.itemCountField} * 1`;
      }

      return `throw new Error()`;
    }

    return lastField.index + getTypeSizeInBytes(lastField.type, lastField.length);

  }

  console.log(`can't find size for structure: ${s.name}`);

  return `throw new Error()`;
}

function generateArrayOfStructuresReaderCode(p: Packet, fieldName: string, index: number, s: Structure, fieldIndexerName: string, countField?: string): string {
  const structureSize = s.length;
  const hasSize = structureSize != null;

  const estSize = getSizeOfStructure(p, s);

  return `const ${fieldName}_count = ${countField ? `${countField}` : 'count'};
    const ${fieldName}: any[] = new Array(${fieldName}_count);
    
    let ${fieldName}_StartOffset = ${fieldIndexerName} + ${index};
    for (let i = 0; i < ${fieldName}_count; i++) {
${s.fields.map(({ type, name, typeName, length, itemCountField, index, leftShifted }, fieldIndex, fields) => {
    if (type === 'Structure[]') {
      const struct = p.structures.find(s => s.name === typeName) ?? globalStructures.find(s => s.name === typeName);

      if (!struct) {
        const e = new Error(`no struct ${typeName}`);
        console.error(e);
        throw e;
      }

      return generateArrayOfStructuresReaderCode(p, name, index, struct, `${fieldName}_StartOffset`, itemCountField);
    }

    const bytesInField = getTypeSizeInBytes(type, length);

    return `      const ${name} = ${getReaderStringForType(type, `${fieldName}_StartOffset + ${index}`, 'b', leftShifted ?? 0, bytesInField, length)};`;
  }).join('\n')}
      ${fieldName}[i] = {
${s.fields.map(({ name, }) => {
    return `        ${name}`;
  }).join(',\n')}
      };
      ${structureSize != null ? `${fieldName}_StartOffset += ${estSize};` : `${fieldName}_StartOffset += ${estSize};`}
    }`;
}

function getEnumName(p: Packet, typeName: string): string {
  if (PREDEFINED_ENUMS.has(typeName)) return typeName as any;

  const pEnum = p.enums.find(e => e.name === typeName);
  if (pEnum) return `${p.name}${typeName}Enum` as any;

  const globalEnum = globalEnums.find(e => e.name === typeName);
  if (globalEnum) return globalEnum.name + 'Enum';

  return `Byte`;
}

function generateStructureDefinition(p: Packet, s: Structure): string {
  let structureFields = '{\n';

  s.fields.forEach(({ type, name, typeName }) => {
    if (type === 'Enum') {
      type = getEnumName(p, typeName ?? type) as any;
      // enums.push(type);
    } else if (type === 'Structure[]') {
      const s = p.structures.find(s => s.name === typeName) ?? globalStructures.find(s => s.name === typeName);
      type = `${generateStructureDefinition(p, s)}[]`;
    } else if (type === 'String') {
      type = 'string';
    }
    structureFields += `  ${name}: ${type};\n`;
  });

  return structureFields + "\n}";
}

rewriter.on("packetDefinitions", {
  element(el) {
    el.onEndTag(() => {
      const any = packets.find(p => p.fields.some(f => f.index == null));
      if (any) {
        console.error(any.name);
      }
      //
      // Generate Global enums
      //
      globalEnums.forEach((packetEnum) => {
        writer.write(`export enum ${packetEnum.name}Enum {
${packetEnum.values.map(v => {
          return `  ${v.name} = ${v.value}`;
        }).join(',\n')}
}

`);
      });

      writer.flush();

      //console.log(JSON.stringify(packets, null, 2));

      packets.forEach(packet => {
        let headerCode: 0xc1 | 0xc2 | 0xc3 | 0xc4 = 0xc1;
        switch (packet.headerType) {
          case "C1HeaderWithSubCode":
          case "C1Header": {
            headerCode = 0xc1;
            break;
          }
          case "C2Header":
          case "C2HeaderWithSubCode": {
            headerCode = 0xc2;
            break;
          }
          case "C3Header":
          case "C3HeaderWithSubCode": {
            headerCode = 0xc3;
            break;
          }
          case "C4Header":
          case "C4HeaderWithSubCode": {
            headerCode = 0xc4;
            break;
          }
        }

        const isSmallSize = (headerCode === 0xc1 || headerCode === 0xc3);
        const hasSubCode = packet.subCode != null;

        //
        // Generate Packet's enums
        // 

        packet.enums.forEach((packetEnum) => {
          writer.write(`export enum ${getEnumName(packet, packetEnum.name)} {
    ${packetEnum.values.map(v => {
            return `${v.name} = ${v.value}`;
          }).join(',\n')}
  }`);
        });

        writer.flush();

        writer.write(
          `export class ${packet.name}Packet {
  buffer!: DataView;
  static readonly Name = \`${packet.name}\`;
  static readonly HeaderType = \`${packet.headerType}\`;
  static readonly HeaderCode = 0x${byteToString(headerCode)};
  static readonly Direction = '${packet.direction}';
  static readonly SentWhen = \`${packet.sentWhen}\`;
  static readonly CausedReaction = \`${packet.causedReaction}\`;
  static readonly Length = ${packet.length};
  static readonly LengthSize = ${isSmallSize ? 1 : 2};
  static readonly DataOffset = ${1 + (isSmallSize ? 1 : 2)};
`
        );

        packet.code != null &&
          writer.write(`  static readonly Code = 0x${byteToString(packet.code)};
`);

        hasSubCode &&
          writer.write(`  static readonly SubCode = 0x${byteToString(
            packet.subCode
          )};
`);
        // +1 for code
        writer.write(`
  static getRequiredSize(dataSize:number){
    return ${packet.name}Packet.DataOffset + 1${hasSubCode ? ` + 1` : ''} + dataSize;
  }
`);

        writer.write(`
  constructor(buffer?: DataView){
    buffer && (this.buffer = buffer);
  }
`);

        writer.write(`
  writeHeader(){
    const b = this.buffer;
    b.setUint8(0, ${packet.name}Packet.HeaderCode);
    b.setUint8(${packet.name}Packet.DataOffset, ${packet.name}Packet.Code);
  ${hasSubCode ? `b.setUint8(${packet.name}Packet.DataOffset + 1, ${packet.name}Packet.SubCode);` : ''}
    return this;
  }
`);

        // TODO: check that size is big endian!
        writer.write(`
  writeLength(l: number|undefined = ${packet.name}Packet.Length){
    const b = this.buffer;
    l = l ?? b.byteLength;
    ${isSmallSize ? `b.setUint8(1, l);` : `b.setUint16(1, l);`}
    return this;
  }
`);

        writer.write(`
  private _readString (from :number, to: number): string {
    let val = "";
    for(let i = from; i < to; i++){
      const ch = String.fromCharCode(this.buffer.getUint8(i));

      if (ch === "\0")break;

      val += ch;
    }
              
    return val;
  }
`);

        writer.write(`
  private _readDataView (from: number, to: number): DataView {
    return new DataView(this.buffer.buffer.slice(from, to));
  }
`);
        writer.write(`
  static createPacket(requiredSize: number${packet.length != null ? ` = ${packet.length}` : ''}): ${packet.name}Packet {
    const p = new ${packet.name}Packet();
    p.buffer = new DataView(new ArrayBuffer(requiredSize));
    p.writeHeader();
    p.writeLength();
    return p;
  }
`);

        packet.fields.forEach(({ index, type, name, typeName, length, itemCountField, leftShifted }) => {
          let getMethod: keyof typeof DataView.prototype = "getUint8";
          let setMethod: keyof typeof DataView.prototype = "getUint8";

          switch (type) {
            case "Byte": {
              getMethod = "getUint8";
              setMethod = "setUint8";

              if (length != null) {
                writer.write(`  get ${name}(){
    return GetByteValue(this.buffer.${getMethod}(${index}), ${length}, ${leftShifted ?? 0});
  }
  set ${name}(value: number) {
    const oldByte = this.buffer.${getMethod}(${index});
    this.buffer.${setMethod}(${index}, SetByteValue(oldByte, value, ${length}, ${leftShifted ?? 0}));
  }
`);
              } else {
                writer.write(`  get ${name}() {
    return GetByteValue(this.buffer.${getMethod}(${index}), 8, ${leftShifted ?? 0});
  }
  set ${name}(value: number) {
    const oldByte = this.buffer.${getMethod}(${index});
    this.buffer.${setMethod}(${index}, SetByteValue(oldByte, value, 8, ${leftShifted ?? 0}));
  }
`);
              }
              return;
            }
            case "Boolean": {
              getMethod = "getUint8";
              setMethod = "setUint8";
              writer.write(`  get ${name}(){
    return GetBoolean(this.buffer.getUint8(${index}), ${leftShifted ?? 0});
  }
  set ${name}(value: boolean){
    const oldByte = this.buffer.getUint8(${index});
    this.buffer.${setMethod}(${index}, SetBoolean(oldByte, value, ${leftShifted ?? 0}));
  }
`);
              return;
            }
            //TODO
            case "Float": {
              getMethod = "getUint32";
              setMethod = "setUint32";
              writer.write(`  get ${name}(){
    return this.buffer.${getMethod}(${index});
  }
  set ${name}(value: number){
    this.buffer.${setMethod}(${index}, value);
  }
`);
              return;
            }
            case "ShortBigEndian": {
              getMethod = "getUint16";
              setMethod = "setUint16";
              writer.write(`  get ${name}(){
    return this.buffer.${getMethod}(${index}, false);
  }
  set ${name}(value: number){
    this.buffer.${setMethod}(${index}, value, false);
  }
`);
              return;
            }
            case "ShortLittleEndian": {
              getMethod = "getUint16";
              setMethod = "setUint16";
              writer.write(`  get ${name}(){
    return this.buffer.${getMethod}(${index}, true);
  }
  set ${name}(value: number){
    this.buffer.${setMethod}(${index}, value, true);
  }
`);
              return;
            }
            case "IntegerBigEndian": {
              getMethod = "getUint32";
              setMethod = "setUint32";
              writer.write(`  get ${name}(){
    return this.buffer.${getMethod}(${index}, false);
  }
  set ${name}(value: number){
    this.buffer.${setMethod}(${index}, value, false);
  }
`);
              return;
            }
            case "IntegerLittleEndian": {
              getMethod = "getUint32";
              setMethod = "setUint32";
              writer.write(`  get ${name}(){
    return this.buffer.${getMethod}(${index}, true);
  }
  set ${name}(value: number){
    this.buffer.${setMethod}(${index}, value, true);
  }
`);
              return;
            }
            case "LongBigEndian": {
              getMethod = "getBigUint64";
              setMethod = "setBigUint64";
              writer.write(`  get ${name}(){
    return this.buffer.${getMethod}(${index}, false);
  }
  set ${name}(value: bigint){
    this.buffer.${setMethod}(${index}, value, false);
  }
`);
              return;
            }
            case "string":
            case "String": {
              writer.write(`  get ${name}(){
    const to = ${length != null ? Number(index) + Number(length) : `this.buffer.byteLength`};
              
    return this._readString(${index}, to);
  }
`);

              writer.write(`  set${name}(str: string, count = ${Number(length)}){
    const from = ${index};
    for(let i = 0; i < str.length; i++){
      const char = str.charCodeAt(i);
      this.buffer.setUint8(from + i, char);
    }
}
`);
              return;
            }
            case "Binary": {
              writer.write(`  get ${name}(){
    const to = ${length != null ? Number(index) + Number(length) : `this.buffer.byteLength`};
    const i = ${index};
              
    return new DataView(this.buffer.buffer.slice(i,to));
  }
`);

              writer.write(`  set${name}(data: number[], count = ${Number(length)}){
    if (data.length !== count) throw new Error(\`data.length must be \${count}\`);
    const from = ${index};

    for (let i = 0; i < data.length; i++) {
      this.buffer.setUint8(from + i, data[i]);
    }
}
`);
              return;
            }

            //TODO
            case "Enum": {
              const l = length ?? 8;
              const enumName = getEnumName(packet, typeName ?? type);
              getMethod = "getUint8";
              setMethod = "setUint8";

              writer.write(`  get ${name}():${enumName}{
    return GetByteValue(this.buffer.${getMethod}(${index}), ${l}, ${leftShifted ?? 0});
  }
  set ${name}(value: ${enumName}){
    const oldValue = this.${name};
    this.buffer.${setMethod}(${index}, SetByteValue(oldValue, value, ${l}, ${leftShifted ?? 0}));
  }
`);
              return;
            }

            default: {
              // Handle Arrays
              if (type.endsWith("[]")) {
                const arrayStartIndex = index;

                const s = packet.structures.find((s) => s.name === typeName) ?? globalStructures.find(s => s.name === typeName);
                if (!s) {
                  console.error("type not parsed:" + type);
                  return;
                }

                const structureType = generateStructureDefinition(packet, s);

                // console.log(`generate get ${name}`, structureType);

                //array getter
                writer.write(
                  `
  get${name}(count: number${itemCountField != null ? ` = this.${itemCountField}` : ''}): ${structureType}[]{
    const b = this.buffer;
    let bi = 0;

    ${generateArrayOfStructuresReaderCode(packet, name, index, s, 'bi')}
    
    return ${name};
  }`);
                return;
              }
              writer.write(`  get ${name}(){
    throw new Error('not implemented type ${type}');
  }
  set ${name}(value: any){
    throw new Error('not implemented type ${type}');
  }
`);
            }
          }
        });

        writer.write(`}
`);
      });

      writer.write(`
export const ${packetsVarName} = [
${packets
          .map((p) => '  ' + p.name + "Packet")
          .join(",\n")}
] as const;`);
      writer.flush();
    });
  },
});

rewriter.on("packetDefinitions > packets", {
  element(el) {
    packets.length = 0;

    el.onEndTag(() => {
      console.log(`packets parsed: ${packets.length}`);
    });
  },
});

rewriter.on("packetDefinitions > packets > packet", {
  element(el) {
    packet = {} as any;
    packet.structures = [];
    packet.enums = [];

    el.onEndTag(() => {
      packets.push(packet);

      packet.fields.forEach((field) => {
        //TODO
        if (field.typeName) {
          field.type = field.type.replace("Structure", field.typeName) as any;
        }
      });
    });
  },
});

registerPacketTextField("name");
registerPacketTextField("headerType");
registerPacketTextField("direction");
registerPacketTextField("sentWhen");
registerPacketTextField("causedReaction");
registerPacketNumberField("code", true);
registerPacketNumberField("subCode", true);
registerPacketNumberField("length");

const registerFieldHandler = (root: string, accessor: () => Field) => {
  rewriter.on(root + " > fields field > name", {
    text(text) {
      parseAsText(accessor(), 'name').text(text);
    },
  });

  rewriter.on(root + " > fields field > description", {
    text(text) {
      parseAsText(accessor(), 'description').text(text);
    },
  });

  rewriter.on(root + " > fields field > type", {
    text(text) {
      parseAsText(accessor(), 'type').text(text);
    },
  });

  rewriter.on(root + " > fields field > typename", {
    text(text) {
      parseAsText(accessor(), 'typeName').text(text);
    },
  });

  rewriter.on(root + " > fields field > index", {
    text(text) {
      parseAsNumber(accessor(), 'index').text(text);
    },
  });

  rewriter.on(root + " > fields field > length", {
    text(text) {
      parseAsNumber(accessor(), 'length').text(text);

    },
  });

  rewriter.on(root + " > fields field > leftshifted", {
    text(text) {
      parseAsNumber(accessor(), 'leftShifted').text(text);

    },
  });

  rewriter.on(root + " > fields field > itemcountfield", {
    text(text) {
      parseAsText(accessor(), 'itemCountField').text(text);
    },
  });
};

rewriter.on("packet > fields", {
  element() {
    packet.fields = [];
  },
});

rewriter.on("packet > fields field", {
  element() {
    packet.fields.push({} as any);
  },
});

registerFieldHandler('packet', getLastField);

rewriter.on("packet structures structure", {
  element(el) {
    packet.structures.push({} as any);
  },
});

rewriter.on("packet structures structure fields", {
  element(el) {
    getLastStructure().fields = [];
  },
});

rewriter.on("packet structures structure > fields field", {
  element(el) {
    getLastStructure().fields.push({} as any);
  },
});

rewriter.on("packet structure > name", {
  text(text) {
    parseAsText(getLastStructure(), 'name').text(text);
  },
});

rewriter.on("packet structure > description", {
  text(text) {
    parseAsText(getLastStructure(), 'description').text(text);

  },
});

rewriter.on("packet structure > length", {
  text(text) {
    parseAsNumber(getLastStructure(), 'length').text(text);

  },
});

registerFieldHandler('packet structure', getLastFieldOfStructure);

//
// Parse packet's enum
//

rewriter.on("packet > enums enum", {
  element(el) {
    packet.enums.push({} as any);
  },
});

rewriter.on("packet > enums enum > values", {
  element(el) {
    getLastEnum().values = [];
  },
});

rewriter.on("packet > enums enum > values enumValue", {
  element(el) {
    getLastEnum().values.push({} as any);
  },
});

rewriter.on("packet > enums enum > name", {
  text(text) {
    parseAsText(getLastEnum(), 'name').text(text);

  },
});

rewriter.on("packet > enums enum > description", {
  text(text) {
    parseAsText(getLastEnum(), 'description').text(text);
  },
});

rewriter.on("packet > enums enum > values enumValue > name", {
  text(text) {
    parseAsText(getLastValueOfEnum(), 'name').text(text);
  },
});

rewriter.on("packet > enums enum > values enumValue > description", {
  text(text) {
    parseAsText(getLastValueOfEnum(), 'description').text(text);
  },
});

rewriter.on("packet > enums enum > values enumValue > value", {
  text(text) {
    parseAsNumber(getLastValueOfEnum(), 'value').text(text);
  },
});

//
// Parse global structures
//

const getLastGlobalStructure = () => globalStructures[globalStructures.length - 1];
const getLastFieldOfGlobalStructure = () => getLastGlobalStructure().fields[getLastGlobalStructure().fields.length - 1];


rewriter.on("packetDefinitions > structures", {
  element(el) {
    globalStructures.length = 0;

    el.onEndTag(() => {
      console.log(`global structures parsed: ${globalStructures.length}`);
    });
  },
});

rewriter.on("packetDefinitions > structures structure", {
  element() {
    globalStructures.push({} as any);
  },
});

rewriter.on("packetDefinitions > structures structure fields", {
  element() {
    getLastGlobalStructure().fields = [];
  },
});

rewriter.on("packetDefinitions > structures structure > fields field", {
  element(el) {
    getLastGlobalStructure().fields.push({} as any);
  },
});

rewriter.on("packetDefinitions > structures structure > name", {
  text(text) {
    parseAsText(getLastGlobalStructure(), 'name').text(text);
  },
});

rewriter.on("packetDefinitions > structures structure > description", {
  text(text) {
    parseAsText(getLastGlobalStructure(), 'description').text(text);

  },
});

rewriter.on("packetDefinitions > structures structure > length", {
  text(text) {
    parseAsNumber(getLastGlobalStructure(), 'length').text(text);

  },
});

registerFieldHandler("packetDefinitions > structures structure", getLastFieldOfGlobalStructure);

//
// Parse global enums
//

const getLastGlobalEnum = () => globalEnums[globalEnums.length - 1];
const getLastValueOfGlobalEnum = () => getLastGlobalEnum().values[getLastGlobalEnum().values.length - 1];

rewriter.on("packetDefinitions > enums", {
  element(el) {
    globalEnums.length = 0;

    el.onEndTag(() => {
      console.log(`global enums parsed`);
    });
  },
});

rewriter.on("packetDefinitions > enums > enum", {
  element() {
    globalEnums.push({} as any);
  },
});

rewriter.on("packetDefinitions > enums > enum > values", {
  element(el) {
    getLastGlobalEnum().values = [];
  },
});

rewriter.on("packetDefinitions > enums > enum > values enumValue", {
  element(el) {
    getLastGlobalEnum().values.push({} as any);
  },
});

rewriter.on("packetDefinitions > enums > enum > name", {
  text(text) {
    parseAsText(getLastGlobalEnum(), 'name').text(text);

  },
});

rewriter.on("packetDefinitions > enums > enum > description", {
  text(text) {
    parseAsText(getLastGlobalEnum(), 'description').text(text);
  },
});

rewriter.on("packetDefinitions > enums > enum > values enumValue > name", {
  text(text) {
    parseAsText(getLastValueOfGlobalEnum(), 'name').text(text);
  },
});

rewriter.on("packetDefinitions > enums > enum > values enumValue > description", {
  text(text) {
    parseAsText(getLastValueOfGlobalEnum(), 'description').text(text);
  },
});

rewriter.on("packetDefinitions > enums > enum > values enumValue > value", {
  text(text) {
    parseAsNumber(getLastValueOfGlobalEnum(), 'value').text(text);
  },
});

//
// Processing
//

const files = [
  "ServerToClientPackets.xml",
  "ConnectServerPackets.xml",
  "ClientToServerPackets.xml",
];

import { unlinkSync } from "node:fs";
import { byteToString } from '../utils';

const indexFileName = __dirname + '/index.ts';

for (const name of files) {
  packetsVarName = name.split('.')[0];
  const csFile = Bun.file(__dirname + "/packetsDefinitions/" + name);
  const tsFile = __dirname + '/' + packetsVarName + '.ts';
  try {
    unlinkSync(tsFile);
  } catch (e) { }
  const csPacketsString = await csFile.text(); // contents as a string

  file = Bun.file(tsFile);
  writer = file.writer();

  writer.write(`
import { CharacterClassNumber } from '../types';
import { SetByteValue, GetByteValue, GetBoolean, SetBoolean } from '../utils';

`);

  packet = null as any;
  packets.length = 0;

  rewriter.transform(new Response(csPacketsString));
}

try {
  try {
    unlinkSync(indexFileName);
  } catch (e) { }

  const file = Bun.file(indexFileName);
  const writer = file.writer();
  for (const name of files.map(n => n.split('.')[0])) {
    writer.write(`export { ${name} } from './${name}';\n`);
  }

  writer.end();
} catch (e) { }
