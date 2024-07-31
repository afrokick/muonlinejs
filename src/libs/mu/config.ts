export class Config {
  static readonly MapSize = 256;
  static readonly HoleHeight = 400.0;

  static readonly MAP_FILE_SIZE = 65536 * 3 + 2;
  static readonly ATT_FILE_65KB_SIZE = 65536 + 4;
  static readonly ATT_FILE_129KB_SIZE = 65536 * 2 + 4;

  static readonly xor_table_3byte = [0xFC, 0xCF, 0xAB];
  static readonly xor_tab_datfile = [0x3F08A79B, 0xE25CC287, 0x93D27AB9, 0x20DEA7BF];
}
