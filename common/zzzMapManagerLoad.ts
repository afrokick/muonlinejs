import { ENUM_OBJECTS } from "./objects/enum";
import { BMD_Open, type BMD } from "./objects/zzzBMD";
import { ENUM_WORLD } from "./types";

export const Models: Record<number, BMD & { m_iBMDSeqID?: number; }> = {};

(window as any).__models = Models;
function LoadBitmap(...params: any[]) { }
function LoadWaveFile(...params: any[]) { }
function padZero(num: number) {
    return num.toString().padStart(2, '0');
}

const BITMAP_BUBBLE = -1;
const BITMAP_WATER = 1;
const BITMAP_SHINES = 1;


const GL_LINEAR = 1;
const GL_REPEAT = 1;

const gLoadData = {
    AccessModel: async (Type: number, Dir: string, FileName: string, i: Int) => {
        let Name = '';
        if (i == -1)
            Name = `${FileName}.bmd`;
        else
            Name = `${FileName}${padZero(i)}.bmd`;

        let Success = false;

        if (!Models[Type]) {
            Models[Type] = await BMD_Open(Dir, Name);
        }

        Models[Type].m_iBMDSeqID = Type;

        const filePath = Dir + Name;

        console.log(`Try to load file: ${filePath}`);

        // Success = Models[Type].Open2(Dir, Name);
        Success = true;

        if (Success == false
            //  && (wcscmp(FileName, "Monster") == NULL || wcscmp(FileName, "Player") == NULL || wcscmp(FileName, "PlayerTest") == NULL || wcscmp(FileName, "Angel") == NULL)
        ) {
            throw new Error(`${Name} file does not exist.`);
        }

    },
    OpenTexture: async (Model: Int, SubFolder: string, Wrap: Int, Type: Int, Check: boolean) => {
        const pModel = Models[Model];

        if(!pModel){
            console.log(`no model ${ENUM_OBJECTS[Model]}(${Model})`);
            return;
        }

        for (let i = 0; i < pModel.NumMeshs; i++) {
            const pTexture = pModel.Textures[i];
            const textureFileName = pTexture.FileName;

            const szFullPath = `./data/${SubFolder}${textureFileName}`;

            // wchar_t __ext[_MAX_EXT] = { 0, };
            //     _wsplitpath(textureFileName, NULL, NULL, NULL, __ext);
            //     if (pTexture.FileName[0] == 's' && pTexture.FileName[1] == 'k' && pTexture.FileName[2] == 'i') {
            //         pModel.IndexTexture[i] = BITMAP_SKIN;
            //     }
            //     else if (!wcsnicmp(textureFileName, L"level", 5)) {
            //         pModel.IndexTexture[i] = BITMAP_SKIN;
            //     }
            //     else if (pTexture.FileName[0] == 'h' && pTexture.FileName[1] == 'i' && pTexture.FileName[2] == 'd') {
            //         pModel.IndexTexture[i] = BITMAP_HIDE;
            //     }
            //     else if (pTexture.FileName[0] == 'h' && pTexture.FileName[1] == 'a' && pTexture.FileName[2] == 'i' && pTexture.FileName[3] == 'r') {
            //         pModel.IndexTexture[i] = BITMAP_HAIR;
            //     }
            //     else if (tolower(__ext[1]) == 't') {
            //         pModel.IndexTexture[i] = Bitmaps.LoadImage(szFullPath, GL_NEAREST, Wrap);
            //     }
            //     else if (tolower(__ext[1]) == 'j') {
            //         pModel.IndexTexture[i] = Bitmaps.LoadImage(szFullPath, Type, Wrap);
            //     }

            //     if (pModel.IndexTexture[i] == BITMAP_UNKNOWN) {
            //         BITMAP_t * pBitmap = Bitmaps.FindTextureByName(textureFileName);
            //         if (pBitmap) {
            //             Bitmaps.LoadImage(pBitmap.BitmapIndex, pBitmap.FileName);
            //             pModel.IndexTexture[i] = pBitmap.BitmapIndex;
            //         }
            //         else {
            //         wchar_t szErrorMsg[256] = { 0, };
            //             swprintf(szErrorMsg, L"OpenTexture Failed: %s of %s", szFullPath, pModel.Name);
            //             #ifdef FOR_WORK;
            //             PopUpErrorCheckMsgBox(szErrorMsg);
            //             #else; // FOR_WORK
            //             PopUpErrorCheckMsgBox(szErrorMsg, true);
            //             #endif; // FOR_WORK
            //             break;
            //         }
            //     }
        }
    }
} as const;

export async function CMapManager_Load(activeWorld: ENUM_WORLD) {
    let i: Int;
    let Temp = true;

    LoadBitmap("Object8/drop01.jpg", BITMAP_BUBBLE);

    switch (activeWorld) {
        case ENUM_WORLD.WD_0LORENCIA:
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_BIRD01, "./data/Object1/", "Bird", 1);
            await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_BIRD01, "Object1/");
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_FISH01, "./data/Object1/", "Fish", 1);
            await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_FISH01, "Object1/");
            break;
        // case ENUM_WORLD.WD_1DUNGEON:
        // case ENUM_WORLD.WD_4LOSTTOWER:
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_DUNGEON_STONE01, "./data/Object2/", "DungeonStone", 1);
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_DUNGEON_STONE01, "Object2/");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_BAT01, "./data/Object2/", "Bat", 1);
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_BAT01, "Object2/");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_RAT01, "./data/Object2/", "Rat", 1);
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_RAT01, "Object2/");
        //     break;
        // case ENUM_WORLD.WD_2DEVIAS:
        //     {
        //         // vec3_t Pos, Ang;
        //         //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_NPC_SERBIS_DONKEY, "Data\\Npc\\", "obj_donkey");
        //         //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_NPC_SERBIS_DONKEY, "Npc\\");
        //         //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_NPC_SERBIS_FLAG, "Data\\Npc\\", "obj_flag");
        //         //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_NPC_SERBIS_FLAG, "Npc\\");

        //         //         Vector(0, 0, 0, Ang);
        //         //         Vector(0, 0, 270, Pos);
        //         //         Pos[0] = 191 * TERRAIN_SCALE; Pos[1] = 16 * TERRAIN_SCALE;
        //         //         CreateObject(ENUM_OBJECTS.MODEL_NPC_SERBIS_DONKEY, Pos, Ang);
        //         //         Pos[0] = 191 * TERRAIN_SCALE; Pos[1] = 17 * TERRAIN_SCALE;
        //         //         CreateObject(ENUM_OBJECTS.MODEL_NPC_SERBIS_FLAG, Pos, Ang);

        //         //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_WARP, "Data\\Npc\\", "warp01");
        //         //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_WARP2, "Data\\Npc\\", "warp02");
        //         //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_WARP3, "Data\\Npc\\", "warp03");
        //         //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_WARP, "Npc\\");
        //         //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_WARP2, "Npc\\");
        //         //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_WARP3, "Npc\\");
        //         //         Vector(0, 0, 10, Ang);
        //         //         Vector(0, 0, 0, Pos);
        //         //         Pos[0] = 53 * TERRAIN_SCALE + 50;
        //         //         Pos[1] = 92 * TERRAIN_SCALE + 20;
        //         //         CreateObject(ENUM_OBJECTS.MODEL_WARP, Pos, Ang);
        //     }
        //     break;
        // case ENUM_WORLD.WD_3NORIA:
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_BUTTERFLY01, "./data/Object1/", "Butterfly", 1);
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_BUTTERFLY01, "Object1/");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_WARP, "Data\\Npc\\", "warp01");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_WARP2, "Data\\Npc\\", "warp02");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_WARP3, "Data\\Npc\\", "warp03");

        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_WARP, "Npc\\");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_WARP2, "Npc\\");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_WARP3, "Npc\\");

        //     // vec3_t Pos, Ang;
        //     //     Vector(0, 0, 10, Ang);
        //     //     Vector(0, 0, 0, Pos);
        //     //     Pos[0] = 223 * TERRAIN_SCALE; Pos[1] = 30 * TERRAIN_SCALE;
        //     //     CreateObject(ENUM_OBJECTS.MODEL_WARP, Pos, Ang);
        //     break;
        // case ENUM_WORLD.WD_5UNKNOWN:
        //     for (let i = 0; i < 5; i++)
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_BIG_METEO1 + i, "Data\\Object6\\", "Meteo", i + 1);

        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_BOSS_HEAD, "Data\\Object6\\", "BossHead", 1);
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_PRINCESS, "Data\\Object6\\", "Princess", 1);
        //     for (let i = MODEL_BIG_METEO1; i <= MODEL_PRINCESS; i++)
        //         await gLoadData.OpenTexture(i, "Object6\\", GL_NEAREST);
        //     break;
        // case ENUM_WORLD.WD_6STADIUM:
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_BUG01, "Data\\Object7\\", "Bug", 1);
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_BUG01, "Object7\\");
        //     break;
        // case ENUM_WORLD.WD_7ATLANSE:
        // case ENUM_WORLD.WD_67DOPPLEGANGER3:
        //     for (let i = 1; i < 9; i++) {
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_FISH01 + i, "Data\\Object8\\", "Fish", i + 1);
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_FISH01 + i, "Object8\\");
        //     }

        //     for (let i = 0; i < 32; i++) {
        //         let FileName = `Object8\\wt${padZero(i)}.jpg`;

        //         LoadBitmap(FileName, BITMAP_WATER + i, GL_LINEAR, GL_REPEAT, false);


        //         FileName = `wt${padZero(i)}.jpg`;

        //         // wcscpy(Bitmaps[BITMAP_WATER + i].FileName, FileName);
        //     }
        //     break;
        // case ENUM_WORLD.WD_8TARKAN:
        //     LoadBitmap("Object9\\sand01.jpg", BITMAP_CHROME + 2, GL_LINEAR, GL_REPEAT);
        //     LoadBitmap("Object9\\sand02.jpg", BITMAP_CHROME + 3, GL_LINEAR, GL_REPEAT);
        //     LoadBitmap("Object9\\Impack03.jpg", BITMAP_IMPACT, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_BUG01 + 1, "Data\\Object9\\", "Bug", 2);
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_BUG01 + 1, "Object9\\");
        //     break;
        // case ENUM_WORLD.WD_10HEAVEN:
        //     LoadBitmap("Effect\\clouds.jpg", BITMAP_CLOUD, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CLOUD, "Data\\Object11\\", "cloud");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CLOUD, "Object11\\");

        //     LoadBitmap("Effect\\cloudLight.jpg", BITMAP_CLOUD + 1, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //     break;

        // case ENUM_WORLD.WD_11BLOODCASTLE1:
        // case ENUM_WORLD.WD_11BLOODCASTLE1 + 1:
        // case ENUM_WORLD.WD_11BLOODCASTLE1 + 2:
        // case ENUM_WORLD.WD_11BLOODCASTLE1 + 3:
        // case ENUM_WORLD.WD_11BLOODCASTLE1 + 4:
        // case ENUM_WORLD.WD_11BLOODCASTLE1 + 5:
        // case ENUM_WORLD.WD_11BLOODCASTLE1 + 6:
        // case ENUM_WORLD.WD_52BLOODCASTLE_MASTER_LEVEL:
        //     {
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CROW, "Data\\Object12\\", "Crow", 1);
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CROW, "Object12\\");

        //         for (let i = 0; i < 2; ++i)
        //             await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_GATE + i, "Monster\\");

        //         LoadBitmap("Effect\\clouds.jpg", BITMAP_CLOUD, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //         LoadWaveFile(SOUND_BLOODCASTLE, "Data\\Sound\\iBloodCastle.wav", 1);
        //     }
        //     break;
        // case ENUM_WORLD.WD_34CRYWOLF_1ST:
        //     {
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SCOLPION, "Data\\Object35\\", "scorpion");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SCOLPION, "Object35\\");

        //         LoadBitmap("Effect\\Map_Smoke1.jpg", BITMAP_CHROME + 2, GL_LINEAR, GL_REPEAT);
        //         LoadBitmap("Effect\\Map_Smoke2.tga", BITMAP_CHROME + 3, GL_LINEAR, GL_REPEAT);
        //         LoadBitmap("Effect\\mhoujin_R.jpg", BITMAP_MAGIC_CIRCLE, GL_LINEAR, GL_CLAMP_TO_EDGE);

        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_ARROW_TANKER, "Data\\Monster\\", "arrowstusk");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_ARROW_TANKER, "Monster\\");
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_ARROW_TANKER_HIT, "Data\\Monster\\", "arrowstusk");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_ARROW_TANKER_HIT, "Monster\\");

        //         LoadBitmap("Effect\\Impack03.jpg", BITMAP_EXT_LOG_IN + 2);
        //         LoadBitmap("Logo\\chasellight.jpg", BITMAP_EFFECT);

        //         LoadWaveFile(SOUND_CRY1ST_AMBIENT, "Data\\Sound\\w35\\crywolf_ambi.wav", 1, true);
        //         LoadWaveFile(SOUND_CRY1ST_WWOLF_MOVE1, "Data\\Sound\\w35\\ww_idle1.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_WWOLF_MOVE2, "Data\\Sound\\w35\\ww_idle2.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_WWOLF_ATTACK1, "Data\\Sound\\w35\\ww_attack1.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_WWOLF_ATTACK2, "Data\\Sound\\w35\\ww_attack2.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_WWOLF_DIE, "Data\\Sound\\w35\\ww_death.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_SCOUT1_MOVE1, "Data\\Sound\\w35\\ww_s1_idle1.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_SCOUT1_MOVE2, "Data\\Sound\\w35\\ww_s1_idle2.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_SCOUT1_ATTACK1, "Data\\Sound\\w35\\ww_s1_attack1.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_SCOUT1_ATTACK2, "Data\\Sound\\w35\\ww_s1_attack2.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_SCOUT1_DIE, "Data\\Sound\\w35\\ww_s1_death.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_SCOUT2_MOVE1, "Data\\Sound\\w35\\ww_s2_idle1.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_SCOUT2_MOVE2, "Data\\Sound\\w35\\ww_s2_idle2.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_SCOUT2_ATTACK1, "Data\\Sound\\w35\\ww_s2_attack1.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_SCOUT2_ATTACK2, "Data\\Sound\\w35\\ww_s2_attack2.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_SCOUT2_DIE, "Data\\Sound\\w35\\ww_s2_death.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_SCOUT3_MOVE1, "Data\\Sound\\w35\\ww_s3_idle1.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_SCOUT3_MOVE2, "Data\\Sound\\w35\\ww_s3_idle2.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_SCOUT3_ATTACK1, "Data\\Sound\\w35\\ww_s3_attack1.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_SCOUT3_ATTACK2, "Data\\Sound\\w35\\ww_s3_attack2.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_SCOUT3_DIE, "Data\\Sound\\w35\\ww_s3_death.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_SORAM_MOVE1, "Data\\Sound\\w35\\soram_idle1.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_SORAM_MOVE2, "Data\\Sound\\w35\\soram_idle2.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_SORAM_ATTACK1, "Data\\Sound\\w35\\soram_attack1.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_SORAM_ATTACK2, "Data\\Sound\\w35\\soram_attack2.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_SORAM_DIE, "Data\\Sound\\w35\\soram_death.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_BALRAM_MOVE1, "Data\\Sound\\w35\\balram_idle1.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_BALRAM_MOVE2, "Data\\Sound\\w35\\balram_idle2.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_BALRAM_ATTACK1, "Data\\Sound\\w35\\balram_attack1.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_BALRAM_ATTACK2, "Data\\Sound\\w35\\balram_attack2.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_BALRAM_DIE, "Data\\Sound\\w35\\balram_death.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_BALGAS_MOVE1, "Data\\Sound\\w35\\balga_idle1.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_BALGAS_MOVE2, "Data\\Sound\\w35\\balga_idle2.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_BALGAS_ATTACK1, "Data\\Sound\\w35\\balga_at1.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_BALGAS_ATTACK2, "Data\\Sound\\w35\\balga_at2.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_BALGAS_DIE, "Data\\Sound\\w35\\balga_death.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_BALGAS_SKILL1, "Data\\Sound\\w35\\balga_skill1.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_BALGAS_SKILL2, "Data\\Sound\\w35\\balga_skill2.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_DARKELF_MOVE1, "Data\\Sound\\w35\\darkelf_idle1.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_DARKELF_MOVE2, "Data\\Sound\\w35\\darkelf_idle2.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_DARKELF_ATTACK1, "Data\\Sound\\w35\\darkelf_at1.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_DARKELF_ATTACK2, "Data\\Sound\\w35\\darkelf_at2.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_DARKELF_DIE, "Data\\Sound\\w35\\darkelf_death.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_DARKELF_SKILL1, "Data\\Sound\\w35\\darkelf_skill1.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_DARKELF_SKILL2, "Data\\Sound\\w35\\darkelf_skill2.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_DEATHSPIRIT_MOVE1, "Data\\Sound\\w35\\dths_idle1.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_DEATHSPIRIT_MOVE2, "Data\\Sound\\w35\\dths_idle2.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_DEATHSPIRIT_ATTACK1, "Data\\Sound\\w35\\dths_at1.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_DEATHSPIRIT_ATTACK2, "Data\\Sound\\w35\\dths_at2.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_DEATHSPIRIT_DIE, "Data\\Sound\\w35\\dths_deat.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_TANKER_ATTACK1, "Data\\Sound\\w35\\tanker_attack.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_TANKER_DIE, "Data\\Sound\\w35\\tanker_death.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_SUMMON, "Data\\Sound\\w35\\spawn_single.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_SUCCESS, "Data\\Sound\\w35\\CW_win.wav", 1);
        //         LoadWaveFile(SOUND_CRY1ST_FAILED, "Data\\Sound\\w35\\CW_lose.wav", 1);
        //     }
        //     break;
        // case ENUM_WORLD.WD_30BATTLECASTLE:
        //     LoadBitmap("Effect\\Map_Smoke1.jpg", BITMAP_CHROME + 2, GL_LINEAR, GL_REPEAT);
        //     LoadBitmap("Effect\\Map_Smoke2.tga", BITMAP_CHROME + 3, GL_LINEAR, GL_REPEAT);
        //     LoadBitmap("World31\\Map1.jpg", BITMAP_INTERFACE_MAP + 1, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //     LoadBitmap("World31\\Map2.jpg", BITMAP_INTERFACE_MAP + 2, GL_LINEAR, GL_CLAMP_TO_EDGE);

        //     LoadWaveFile(SOUND_BC_AMBIENT, "Data\\Sound\\BattleCastle\\aSiegeAmbi.wav", 1, true);
        //     LoadWaveFile(SOUND_BC_AMBIENT_BATTLE1, "Data\\Sound\\BattleCastle\\RanAmbi1.wav", 1, true);
        //     LoadWaveFile(SOUND_BC_AMBIENT_BATTLE2, "Data\\Sound\\BattleCastle\\RanAmbi2.wav", 1, true);
        //     LoadWaveFile(SOUND_BC_AMBIENT_BATTLE3, "Data\\Sound\\BattleCastle\\RanAmbi3.wav", 1, true);
        //     LoadWaveFile(SOUND_BC_AMBIENT_BATTLE4, "Data\\Sound\\BattleCastle\\RanAmbi4.wav", 1, true);
        //     LoadWaveFile(SOUND_BC_AMBIENT_BATTLE5, "Data\\Sound\\BattleCastle\\RanAmbi5.wav", 1, true);
        //     LoadWaveFile(SOUND_BC_GUARD_STONE_DIS, "Data\\Sound\\BattleCastle\\oGuardStoneDis.wav", 1, true);
        //     LoadWaveFile(SOUND_BC_SHIELD_SPACE_DIS, "Data\\Sound\\BattleCastle\\oProtectionDis.wav", 1, true);
        //     LoadWaveFile(SOUND_BC_CATAPULT_ATTACK, "Data\\Sound\\BattleCastle\\oSWFire.wav", 1, true);
        //     LoadWaveFile(SOUND_BC_CATAPULT_HIT, "Data\\Sound\\BattleCastle\\oSWHitG.wav", MAX_CHANNEL, true);
        //     LoadWaveFile(SOUND_BC_WALL_HIT, "Data\\Sound\\BattleCastle\\oSWHit.wav", MAX_CHANNEL, true);

        //     LoadWaveFile(SOUND_BC_GATE_OPEN, "Data\\Sound\\BattleCastle\\oCDoorMove.wav", 1, true);
        //     LoadWaveFile(SOUND_BC_GUARDIAN_ATTACK, "Data\\Sound\\BattleCastle\\mGMercAttack.wav", 1, true);
        //     LoadWaveFile(SOUND_BMS_STUN, "Data\\Sound\\BattleCastle\\sDStun.wav", MAX_CHANNEL, true);
        //     LoadWaveFile(SOUND_BMS_STUN_REMOVAL, "Data\\Sound\\BattleCastle\\sDStunCancel.wav", MAX_CHANNEL, true);
        //     LoadWaveFile(SOUND_BMS_MANA, "Data\\Sound\\BattleCastle\\sDSwllMana.wav", MAX_CHANNEL, true);
        //     LoadWaveFile(SOUND_BMS_INVISIBLE, "Data\\Sound\\BattleCastle\\sDTrans.wav", MAX_CHANNEL, true);
        //     LoadWaveFile(SOUND_BMS_VISIBLE, "Data\\Sound\\BattleCastle\\sDStunCancel.wav", MAX_CHANNEL, true);
        //     LoadWaveFile(SOUND_BMS_MAGIC_REMOVAL, "Data\\Sound\\BattleCastle\\sDMagicCancel.wav", MAX_CHANNEL, true);
        //     LoadWaveFile(SOUND_BCS_RUSH, "Data\\Sound\\BattleCastle\\sCHaveyBlow.wav", MAX_CHANNEL, true);
        //     LoadWaveFile(SOUND_BCS_JAVELIN, "Data\\Sound\\BattleCastle\\sCShockWave.wav", MAX_CHANNEL, true);
        //     LoadWaveFile(SOUND_BCS_DEEP_IMPACT, "Data\\Sound\\BattleCastle\\sCFireArrow.wav", MAX_CHANNEL, true);
        //     LoadWaveFile(SOUND_BCS_DEATH_CANON, "Data\\Sound\\BattleCastle\\sCMW.wav", MAX_CHANNEL, true);
        //     LoadWaveFile(SOUND_BCS_ONE_FLASH, "Data\\Sound\\BattleCastle\\sCColdAttack.wav", MAX_CHANNEL, true);
        //     LoadWaveFile(SOUND_BCS_SPACE_SPLIT, "Data\\Sound\\BattleCastle\\sCDarkAttack.wav", MAX_CHANNEL, true);
        //     LoadWaveFile(SOUND_BCS_BRAND_OF_SKILL, "Data\\Sound\\BattleCastle\\sCDarkAssist.wav", 1, true);
        //     break;

        // case ENUM_WORLD.WD_31HUNTING_GROUND:
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_BUTTERFLY01, "./data/Object1/", "Butterfly", 1);
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_BUTTERFLY01, "Object1/");

        //     LoadBitmap("Effect\\clouds.jpg", BITMAP_CLOUD, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //     LoadBitmap("Monster\\bossmap1_R.jpg", BITMAP_HGBOSS_PATTERN, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //     LoadBitmap("Monster\\bosswing.tga", BITMAP_HGBOSS_WING, GL_NEAREST, GL_REPEAT);
        //     LoadBitmap("Skill\\bossrock1_R.JPG", BITMAP_FISSURE_FIRE, GL_LINEAR, GL_CLAMP_TO_EDGE);

        //     LoadWaveFile(SOUND_BC_HUNTINGGROUND_AMBIENT, "Data\\Sound\\w31\\aW31.wav", 1, true);
        //     LoadWaveFile(SOUND_BC_AXEWARRIOR_MOVE1, "Data\\Sound\\w31\\mAWidle1.wav", 1);
        //     LoadWaveFile(SOUND_BC_AXEWARRIOR_MOVE2, "Data\\Sound\\w31\\mAWidle2.wav", 1);
        //     LoadWaveFile(SOUND_BC_AXEWARRIOR_ATTACK1, "Data\\Sound\\w31\\mAWattack1.wav", 1);
        //     LoadWaveFile(SOUND_BC_AXEWARRIOR_ATTACK2, "Data\\Sound\\w31\\mAWattack2.wav", 1);
        //     LoadWaveFile(SOUND_BC_AXEWARRIOR_DIE, "Data\\Sound\\w31\\mAWdeath.wav", 1);
        //     LoadWaveFile(SOUND_BC_LIZARDWARRIOR_MOVE1, "Data\\Sound\\w31\\mLWidle1.wav", 1);
        //     LoadWaveFile(SOUND_BC_LIZARDWARRIOR_MOVE2, "Data\\Sound\\w31\\mLWidle2.wav", 1);
        //     LoadWaveFile(SOUND_BC_LIZARDWARRIOR_ATTACK1, "Data\\Sound\\w31\\mLWattack1.wav", 1);
        //     LoadWaveFile(SOUND_BC_LIZARDWARRIOR_ATTACK2, "Data\\Sound\\w31\\mLWattack2.wav", 1);
        //     LoadWaveFile(SOUND_BC_LIZARDWARRIOR_DIE, "Data\\Sound\\w31\\mLWdeath.wav", 1);
        //     LoadWaveFile(SOUND_BC_POISONGOLEM_MOVE1, "Data\\Sound\\w31\\mPGidle1.wav", 1);
        //     LoadWaveFile(SOUND_BC_POISONGOLEM_MOVE2, "Data\\Sound\\w31\\mPGidle2.wav", 1);
        //     LoadWaveFile(SOUND_BC_POISONGOLEM_ATTACK1, "Data\\Sound\\w31\\mPGattack1.wav", 1);
        //     LoadWaveFile(SOUND_BC_POISONGOLEM_ATTACK2, "Data\\Sound\\w31\\mPGattack2.wav", 1);
        //     LoadWaveFile(SOUND_BC_POISONGOLEM_ATTACK3, "Data\\Sound\\w31\\mPGeff1.wav", 1);
        //     LoadWaveFile(SOUND_BC_POISONGOLEM_DIE, "Data\\Sound\\w31\\mPGdeath.wav", 1);
        //     LoadWaveFile(SOUND_BC_QUEENBEE_MOVE1, "Data\\Sound\\w31\\mQBidle1.wav", 1);
        //     LoadWaveFile(SOUND_BC_QUEENBEE_MOVE2, "Data\\Sound\\w31\\mQBidle2.wav", 1);
        //     LoadWaveFile(SOUND_BC_QUEENBEE_ATTACK1, "Data\\Sound\\w31\\mQBattack1.wav", 1);
        //     LoadWaveFile(SOUND_BC_QUEENBEE_ATTACK2, "Data\\Sound\\w31\\mQBattack2.wav", 1);
        //     LoadWaveFile(SOUND_BC_QUEENBEE_DIE, "Data\\Sound\\w31\\mQBdeath.wav", 1);
        //     LoadWaveFile(SOUND_BC_FIREGOLEM_MOVE1, "Data\\Sound\\w31\\mFGidle1.wav", 1);
        //     LoadWaveFile(SOUND_BC_FIREGOLEM_MOVE2, "Data\\Sound\\w31\\mFGidle2.wav", 1);
        //     LoadWaveFile(SOUND_BC_FIREGOLEM_ATTACK1, "Data\\Sound\\w31\\mFGattack1.wav", 1);
        //     LoadWaveFile(SOUND_BC_FIREGOLEM_ATTACK2, "Data\\Sound\\w31\\mFGattack2.wav", 1);
        //     LoadWaveFile(SOUND_BC_FIREGOLEM_DIE, "Data\\Sound\\w31\\mFGdeath.wav", 1);
        //     LoadWaveFile(SOUND_BC_EROHIM_ENTER, "Data\\Sound\\w31\\mELOidle1.wav", 1);
        //     LoadWaveFile(SOUND_BC_EROHIM_ATTACK1, "Data\\Sound\\w31\\mELOattack1.wav", 1);
        //     LoadWaveFile(SOUND_BC_EROHIM_ATTACK2, "Data\\Sound\\w31\\mELOattack2.wav", 1);
        //     LoadWaveFile(SOUND_BC_EROHIM_ATTACK3, "Data\\Sound\\w31\\mELOeff1.wav", 1);
        //     LoadWaveFile(SOUND_BC_EROHIM_DIE, "Data\\Sound\\w31\\mELOdeath.wav", 1);
        //     break;
        // case ENUM_WORLD.WD_33AIDA:
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_BUTTERFLY01, "./data/Object1/", "Butterfly", 1);
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_BUTTERFLY01, "Object1/");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_TREE_ATTACK, "Data\\Object34\\", "tree_eff");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_TREE_ATTACK, "Object34\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_BUG01 + 1, "Data\\Object9\\", "Bug", 2);
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_BUG01 + 1, "Object9\\");

        //     LoadBitmap("Effect\\clouds.jpg", BITMAP_CLOUD, GL_LINEAR, GL_CLAMP_TO_EDGE);

        //     LoadWaveFile(SOUND_AIDA_AMBIENT, "Data\\Sound\\w34\\aida_ambi.wav", 1, true);
        //     LoadWaveFile(SOUND_AIDA_BLUEGOLEM_MOVE1, "Data\\Sound\\w34\\bg_idle1.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_BLUEGOLEM_MOVE2, "Data\\Sound\\w34\\bg_idle2.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_BLUEGOLEM_ATTACK1, "Data\\Sound\\w34\\bg_attack1.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_BLUEGOLEM_ATTACK2, "Data\\Sound\\w34\\bg_attack2.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_BLUEGOLEM_DIE, "Data\\Sound\\w34\\bg_death.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_DEATHRAIDER_MOVE1, "Data\\Sound\\w34\\dr_idle1.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_DEATHRAIDER_MOVE2, "Data\\Sound\\w34\\dr_idle2.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_DEATHRAIDER_ATTACK1, "Data\\Sound\\w34\\dr_attack1.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_DEATHRAIDER_ATTACK2, "Data\\Sound\\w34\\dr_attack2.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_DEATHRAIDER_DIE, "Data\\Sound\\w34\\dr_death.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_DEATHTREE_MOVE1, "Data\\Sound\\w34\\dt_idle1.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_DEATHTREE_MOVE2, "Data\\Sound\\w34\\dt_idle2.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_DEATHTREE_ATTACK1, "Data\\Sound\\w34\\dt_attack1.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_DEATHTREE_ATTACK2, "Data\\Sound\\w34\\dt_attack2.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_DEATHTREE_DIE, "Data\\Sound\\w34\\dt_death.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_FORESTORC_MOVE1, "Data\\Sound\\w34\\fo_idle1.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_FORESTORC_MOVE2, "Data\\Sound\\w34\\fo_idle2.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_FORESTORC_ATTACK1, "Data\\Sound\\w34\\fo_attack1.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_FORESTORC_ATTACK2, "Data\\Sound\\w34\\fo_attack2.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_FORESTORC_DIE, "Data\\Sound\\w34\\fo_death.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_HELL_MOVE1, "Data\\Sound\\w34\\hm_idle1.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_HELL_MOVE2, "Data\\Sound\\w34\\hm_idle2.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_HELL_ATTACK1, "Data\\Sound\\w34\\hm_attack1.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_HELL_ATTACK2, "Data\\Sound\\w34\\hm_firelay.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_HELL_ATTACK3, "Data\\Sound\\w34\\hm_bloodywind.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_HELL_DIE, "Data\\Sound\\w34\\hm_death.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_WITCHQUEEN_MOVE1, "Data\\Sound\\w34\\wq_idle1.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_WITCHQUEEN_MOVE2, "Data\\Sound\\w34\\wq_idle2.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_WITCHQUEEN_ATTACK1, "Data\\Sound\\w34\\wq_attack1.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_WITCHQUEEN_ATTACK2, "Data\\Sound\\w34\\wq_attack2.wav", 1);
        //     LoadWaveFile(SOUND_AIDA_WITCHQUEEN_DIE, "Data\\Sound\\w34\\wq_death.wav", 1);
        //     LoadWaveFile(SOUND_CHAOS_THUNDER01, "Data\\Sound\\eElec1.wav", 1);
        //     LoadWaveFile(SOUND_CHAOS_THUNDER02, "Data\\Sound\\eElec2.wav", 1);
        //     break;
        // case ENUM_WORLD.WD_68DOPPLEGANGER4:
        //     LoadBitmap("Effect\\clouds.jpg", BITMAP_CLOUD, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //     LoadBitmap("effect\\water.jpg", BITMAP_TWINTAIL_WATER, GL_LINEAR, GL_CLAMP_TO_EDGE);
        // case ENUM_WORLD.WD_37KANTURU_1ST:
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_BUTTERFLY01, "./data/Object1/", "Butterfly", 1);
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_BUTTERFLY01, "Object1/");

        //     LoadWaveFile(SOUND_KANTURU_1ST_BG_WATERFALL, "Data\\Sound\\w37\\kan_ruin_waterfall.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_BG_ELEC, "Data\\Sound\\w37\\kan_ruin_elec.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_BG_WHEEL, "Data\\Sound\\w37\\kan_ruin_wheel.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_BG_PLANT, "Data\\Sound\\w37\\kan_ruin_plant.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_BG_GLOBAL, "Data\\Sound\\w37\\kan_ruin_global.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_BER_MOVE1, "Data\\Sound\\w37\\ber_idle-01.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_BER_MOVE2, "Data\\Sound\\w37\\ber_idle-02.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_BER_ATTACK1, "Data\\Sound\\w37\\ber_attack-01.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_BER_ATTACK2, "Data\\Sound\\w37\\ber_attack-02.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_BER_DIE, "Data\\Sound\\w37\\ber_death.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_GIGAN_MOVE1, "Data\\Sound\\w37\\gigan_idle-01.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_GIGAN_ATTACK1, "Data\\Sound\\w37\\gigan_attack-01.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_GIGAN_ATTACK2, "Data\\Sound\\w37\\gigan_attack-02.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_GIGAN_DIE, "Data\\Sound\\w37\\gigan_death.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_GENO_MOVE1, "Data\\Sound\\w37\\geno_idle-01.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_GENO_MOVE2, "Data\\Sound\\w37\\geno_idle-02.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_GENO_ATTACK1, "Data\\Sound\\w37\\geno_attack-01.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_GENO_ATTACK2, "Data\\Sound\\w37\\geno_attack-02.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_GENO_DIE, "Data\\Sound\\w37\\geno_death.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_KENTA_MOVE1, "Data\\Sound\\w37\\kenta_idle-01.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_KENTA_MOVE2, "Data\\Sound\\w37\\kenta_idle-02.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_KENTA_ATTACK1, "Data\\Sound\\w37\\kenta_attack-01.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_KENTA_ATTACK2, "Data\\Sound\\w37\\kenta_skill-01.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_KENTA_DIE, "Data\\Sound\\w37\\kenta_death.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_BLADE_MOVE1, "Data\\Sound\\w37\\blade_idle-01.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_BLADE_MOVE2, "Data\\Sound\\w37\\blade_idle-02.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_BLADE_ATTACK1, "Data\\Sound\\w37\\blade_attack-01.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_BLADE_ATTACK2, "Data\\Sound\\w37\\blade_attack-02.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_BLADE_DIE, "Data\\Sound\\w37\\blade_death.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_SATI_MOVE1, "Data\\Sound\\w37\\sati_idle-01.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_SATI_MOVE2, "Data\\Sound\\w37\\sati_idle-02.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_SATI_ATTACK1, "Data\\Sound\\w37\\sati_attack-01.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_SATI_ATTACK2, "Data\\Sound\\w37\\sati_attack-02.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_SATI_DIE, "Data\\Sound\\w37\\sati_death.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_SWOLF_MOVE1, "Data\\Sound\\w37\\swolf_idle-01.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_SWOLF_MOVE2, "Data\\Sound\\w37\\swolf_idle-02.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_SWOLF_ATTACK1, "Data\\Sound\\w37\\swolf_attack-01.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_SWOLF_ATTACK2, "Data\\Sound\\w37\\swolf_attack-02.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_SWOLF_DIE, "Data\\Sound\\w37\\swolf_death.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_IR_MOVE1, "Data\\Sound\\w37\\ir_idle-01.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_IR_MOVE2, "Data\\Sound\\w37\\ir_idle-02.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_IR_ATTACK1, "Data\\Sound\\w37\\ir_attack-01.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_IR_ATTACK2, "Data\\Sound\\w37\\ir_attack-02.wav", 1);
        //     LoadWaveFile(SOUND_KANTURU_1ST_IR_DIE, "Data\\Sound\\w37\\ir_death.wav", 1);
        //     break;
        // case ENUM_WORLD.WD_38KANTURU_2ND:
        //     {
        //         g_TrapCanon.Open_TrapCanon();

        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_STORM2, "Data\\SKill\\", "boswind");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_STORM2, "SKill\\");
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_STORM3, "Data\\Skill\\", "mayatonedo");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_STORM3, "Skill\\");

        //         LoadBitmap("Object39\\k_effect_01.JPG", BITMAP_KANTURU_2ND_EFFECT1, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //         LoadBitmap("Npc\\khs_kan2gate001.jpg", BITMAP_KANTURU_2ND_NPC1, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //         LoadBitmap("Npc\\khs_kan2gate003.jpg", BITMAP_KANTURU_2ND_NPC2, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //         LoadBitmap("Npc\\khs_kan2gate004.jpg", BITMAP_KANTURU_2ND_NPC3, GL_LINEAR, GL_CLAMP_TO_EDGE);

        //         LoadWaveFile(SOUND_KANTURU_2ND_MAPSOUND_GEAR, "Data\\Sound\\w38\\kan_relic_gear.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_2ND_MAPSOUND_INCUBATOR, "Data\\Sound\\w38\\kan_relic_incubator.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_2ND_MAPSOUND_HOLE, "Data\\Sound\\w38\\kan_relic_hole.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_2ND_MAPSOUND_GLOBAL, "Data\\Sound\\w38\\kan_relic_global.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_2ND_PERSO_MOVE1, "Data\\Sound\\w38\\perso_idle-01.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_2ND_PERSO_MOVE2, "Data\\Sound\\w38\\perso_idle-02.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_2ND_PERSO_ATTACK1, "Data\\Sound\\w38\\perso_attack-01.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_2ND_PERSO_ATTACK2, "Data\\Sound\\w38\\perso_attack-02.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_2ND_PERSO_DIE, "Data\\Sound\\w38\\perso_death.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_2ND_TWIN_MOVE1, "Data\\Sound\\w38\\twin_idle-01.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_2ND_TWIN_MOVE2, "Data\\Sound\\w38\\twin_idle-02.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_2ND_TWIN_ATTACK1, "Data\\Sound\\w38\\twin_attack-01.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_2ND_TWIN_ATTACK2, "Data\\Sound\\w38\\twin_attack-02.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_2ND_TWIN_DIE, "Data\\Sound\\w38\\twin_death.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_2ND_DRED_MOVE1, "Data\\Sound\\w38\\dred_idle-01.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_2ND_DRED_MOVE2, "Data\\Sound\\w38\\dred_idle-02.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_2ND_DRED_ATTACK1, "Data\\Sound\\w38\\dred_attack-01.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_2ND_DRED_ATTACK2, "Data\\Sound\\w38\\dred_attack-02.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_2ND_DRED_DIE, "Data\\Sound\\w38\\dred_death.wav", 1);
        //     }
        //     break;
        // case ENUM_WORLD.WD_39KANTURU_3RD:
        //     {
        //         LoadBitmap("Monster\\nightmare_R.jpg", BITMAP_NIGHTMARE_EFFECT1, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //         LoadBitmap("Monster\\nightmaresward_R.jpg", BITMAP_NIGHTMARE_EFFECT2, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //         LoadBitmap("Monster\\nightmare_cloth.tga", BITMAP_NIGHTMARE_ROBE);
        //         LoadBitmap("Object40\\maya01_R.jpg", BITMAP_MAYA_BODY, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //         LoadBitmap("Object40\\Mtowereffe.JPG", BITMAP_KANTURU3RD_OBJECT, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //         LoadBitmap("Effect\\bluering0001_R.jpg", BITMAP_ENERGY_RING, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //         LoadBitmap("Effect\\bluewave0001_R.jpg", BITMAP_ENERGY_FIELD, GL_LINEAR, GL_CLAMP_TO_EDGE);

        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_STORM2, "Data\\SKill\\", "boswind");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_STORM2, "SKill\\");
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_STORM3, "Data\\Skill\\", "mayatonedo");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_STORM3, "Skill\\");
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_MAYASTAR, "Data\\Skill\\", "arrowsre05");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_MAYASTAR, "Skill\\");
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_MAYASTONE1, "Data\\Skill\\", "mayastone01");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_MAYASTONE1, "Skill\\");
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_MAYASTONE2, "Data\\Skill\\", "mayastone02");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_MAYASTONE2, "Skill\\");
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_MAYASTONE3, "Data\\Skill\\", "mayastone03");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_MAYASTONE3, "Skill\\");
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_MAYASTONE4, "Data\\Skill\\", "mayastone04");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_MAYASTONE4, "Skill\\");
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_MAYASTONE5, "Data\\Skill\\", "mayastone05");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_MAYASTONE5, "Skill\\");
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_MAYASTONEFIRE, "Data\\Skill\\", "mayastonebluefire");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_MAYASTONEFIRE, "Skill\\");
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_MAYAHANDSKILL, "Data\\Skill\\", "hendlight02");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_MAYAHANDSKILL, "Skill\\");

        //         LoadWaveFile(SOUND_KANTURU_3RD_MAYA_INTRO, "Data\\Sound\\w39\\maya_intro.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_3RD_MAYA_END, "Data\\Sound\\w39\\maya_death.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_3RD_MAYA_STORM, "Data\\Sound\\w39\\maya_storm.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_3RD_MAYAHAND_ATTACK1, "Data\\Sound\\w39\\maya_hand_attack-01.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_3RD_MAYAHAND_ATTACK2, "Data\\Sound\\w39\\maya_hand_attack-02.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_3RD_NIGHTMARE_INTRO, "Data\\Sound\\w39\\nightmare_intro.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_3RD_NIGHTMARE_ATT1, "Data\\Sound\\w39\\nightmare_attack-01.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_3RD_NIGHTMARE_ATT2, "Data\\Sound\\w39\\nightmare_skill-01", 1);
        //         LoadWaveFile(SOUND_KANTURU_3RD_NIGHTMARE_ATT3, "Data\\Sound\\w39\\nightmare_skill-02", 1);
        //         LoadWaveFile(SOUND_KANTURU_3RD_NIGHTMARE_ATT4, "Data\\Sound\\w39\\nightmare_skill-03", 1);
        //         LoadWaveFile(SOUND_KANTURU_3RD_NIGHTMARE_DIE, "Data\\Sound\\w39\\nightmare_death.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_3RD_NIGHTMARE_IDLE1, "Data\\Sound\\w39\\nightmare_idle-01.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_3RD_NIGHTMARE_IDLE2, "Data\\Sound\\w39\\nightmare_idle-02.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_3RD_NIGHTMARE_TELE, "Data\\Sound\\w39\\nightmare_tele.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_3RD_MAP_SOUND01, "Data\\Sound\\w39\\kan_boss_crystal.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_3RD_MAP_SOUND02, "Data\\Sound\\w39\\kan_boss_disfield.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_3RD_MAP_SOUND03, "Data\\Sound\\w39\\kan_boss_field.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_3RD_MAP_SOUND04, "Data\\Sound\\w39\\kan_boss_gear.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_3RD_MAP_SOUND05, "Data\\Sound\\w39\\kan_boss_incubator.wav", 1);
        //         LoadWaveFile(SOUND_KANTURU_3RD_AMBIENT, "Data\\Sound\\w39\\kan_boss_global.wav", 1);
        //     }
        //     break;
        // case ENUM_WORLD.WD_45CURSEDTEMPLE_LV1:
        // case ENUM_WORLD.WD_45CURSEDTEMPLE_LV2:
        // case ENUM_WORLD.WD_45CURSEDTEMPLE_LV3:
        // case ENUM_WORLD.WD_45CURSEDTEMPLE_LV4:
        // case ENUM_WORLD.WD_45CURSEDTEMPLE_LV5:
        // case ENUM_WORLD.WD_45CURSEDTEMPLE_LV6:
        //     {
        //         LoadBitmap("Effect\\clouds.jpg", BITMAP_CLOUD, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //         LoadBitmap("Effect\\clud64.jpg", BITMAP_CLUD64, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //         LoadBitmap("Effect\\ghosteffect01.jpg", BITMAP_GHOST_CLOUD1, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //         LoadBitmap("Effect\\ghosteffect02.jpg", BITMAP_GHOST_CLOUD2, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //         LoadBitmap("Effect\\torchfire.jpg", BITMAP_TORCH_FIRE, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //         LoadBitmap("Effect\\clouds2.jpg", BITMAP_EVENT_CLOUD, GL_LINEAR, GL_CLAMP_TO_EDGE);

        //         //EFFECT
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_FALL_STONE_EFFECT, "Data\\Object47\\", "Stoneeffec");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_FALL_STONE_EFFECT, "Object47\\");
        //         //game system sound
        //         LoadWaveFile(SOUND_CURSEDTEMPLE_GAMESYSTEM1, "Data\\Sound\\w47\\cursedtemple_start01.wav", 1);
        //         LoadWaveFile(SOUND_CURSEDTEMPLE_GAMESYSTEM2, "Data\\Sound\\w47\\cursedtemple_statue01.wav", 1);
        //         LoadWaveFile(SOUND_CURSEDTEMPLE_GAMESYSTEM3, "Data\\Sound\\w47\\cursedtemple_holy01.wav", 1);
        //         LoadWaveFile(SOUND_CURSEDTEMPLE_GAMESYSTEM4, "Data\\Sound\\w47\\cursedtemple_score01.wav", 1);
        //         LoadWaveFile(SOUND_CURSEDTEMPLE_GAMESYSTEM5, "Data\\Sound\\w47\\cursedtemple_end01.wav", 1);
        //         //moster 1 - 2 effect sound
        //         LoadWaveFile(SOUND_CURSEDTEMPLE_MONSTER1_IDLE, "Data\\Sound\\w47\\cursedtemple_idle01.wav", 1);
        //         LoadWaveFile(SOUND_CURSEDTEMPLE_MONSTER_MOVE, "Data\\Sound\\w47\\cursedtemple_move01.wav", 1);
        //         LoadWaveFile(SOUND_CURSEDTEMPLE_MONSTER1_DAMAGE, "Data\\Sound\\w47\\cursedtemple_damage01.wav", 1);
        //         LoadWaveFile(SOUND_CURSEDTEMPLE_MONSTER1_DEATH, "Data\\Sound\\w47\\cursedtemple_death01.wav", 1);
        //         //moster 3 effect sound
        //         LoadWaveFile(SOUND_CURSEDTEMPLE_MONSTER2_IDLE, "Data\\Sound\\w47\\cursedtemple_idle02.wav", 1);
        //         LoadWaveFile(SOUND_CURSEDTEMPLE_MONSTER2_ATTACK, "Data\\Sound\\w47\\cursedtemple_Attack01.wav", 1);
        //         LoadWaveFile(SOUND_CURSEDTEMPLE_MONSTER2_DAMAGE, "Data\\Sound\\w47\\cursedtemple_damage02.wav", 1);
        //         LoadWaveFile(SOUND_CURSEDTEMPLE_MONSTER2_DEATH, "Data\\Sound\\w47\\cursedtemple_death02.wav", 1);
        //     }
        //     break;
        // case ENUM_WORLD.WD_41CHANGEUP3RD_1ST:
        //     LoadBitmap("Effect\\clouds.jpg", BITMAP_CLOUD, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //     LoadBitmap("Effect\\firered.jpg", BITMAP_FIRE_RED, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //     LoadBitmap("Effect\\FireSnuff.jpg", BITMAP_FIRE_SNUFF, GL_LINEAR, GL_CLAMP_TO_EDGE);      //  �Ҿ�.

        //     LoadWaveFile(SOUND_3RD_CHANGE_UP_BG_CAGE1, "Data\\Sound\\w42\\cage01.wav", 1);
        //     LoadWaveFile(SOUND_3RD_CHANGE_UP_BG_CAGE2, "Data\\Sound\\w42\\cage02.wav", 1);
        //     LoadWaveFile(SOUND_3RD_CHANGE_UP_BG_VOLCANO, "Data\\Sound\\w42\\volcano.wav", 1);
        //     LoadWaveFile(SOUND_3RD_CHANGE_UP_BG_FIREPILLAR, "Data\\Sound\\w42\\firepillar.wav", 1);
        //     LoadWaveFile(SOUND_CRY1ST_BALRAM_MOVE1, "Data\\Sound\\w35\\balram_idle1.wav", 1);
        //     LoadWaveFile(SOUND_CRY1ST_BALRAM_MOVE2, "Data\\Sound\\w35\\balram_idle2.wav", 1);
        //     LoadWaveFile(SOUND_CRY1ST_BALRAM_ATTACK1, "Data\\Sound\\w35\\balram_attack1.wav", 1);
        //     LoadWaveFile(SOUND_CRY1ST_BALRAM_ATTACK2, "Data\\Sound\\w35\\balram_attack2.wav", 1);
        //     LoadWaveFile(SOUND_CRY1ST_BALRAM_DIE, "Data\\Sound\\w35\\balram_death.wav", 1);
        //     LoadWaveFile(SOUND_CRY1ST_DEATHSPIRIT_MOVE1, "Data\\Sound\\w35\\dths_idle1.wav", 1);
        //     LoadWaveFile(SOUND_CRY1ST_DEATHSPIRIT_MOVE2, "Data\\Sound\\w35\\dths_idle2.wav", 1);
        //     LoadWaveFile(SOUND_CRY1ST_DEATHSPIRIT_ATTACK1, "Data\\Sound\\w35\\dths_at1.wav", 1);
        //     LoadWaveFile(SOUND_CRY1ST_DEATHSPIRIT_ATTACK2, "Data\\Sound\\w35\\dths_at2.wav", 1);
        //     LoadWaveFile(SOUND_CRY1ST_DEATHSPIRIT_DIE, "Data\\Sound\\w35\\dths_deat.wav", 1);
        //     LoadWaveFile(SOUND_CRY1ST_SORAM_MOVE1, "Data\\Sound\\w35\\soram_idle1.wav", 1);
        //     LoadWaveFile(SOUND_CRY1ST_SORAM_MOVE2, "Data\\Sound\\w35\\soram_idle2.wav", 1);
        //     LoadWaveFile(SOUND_CRY1ST_SORAM_ATTACK1, "Data\\Sound\\w35\\soram_attack1.wav", 1);
        //     LoadWaveFile(SOUND_CRY1ST_SORAM_ATTACK2, "Data\\Sound\\w35\\soram_attack2.wav", 1);
        //     LoadWaveFile(SOUND_CRY1ST_SORAM_DIE, "Data\\Sound\\w35\\soram_death.wav", 1);
        //     break;
        // case ENUM_WORLD.WD_42CHANGEUP3RD_2ND:
        //     LoadBitmap("Effect\\clouds.jpg", BITMAP_CLOUD, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //     LoadBitmap("Effect\\firered.jpg", BITMAP_FIRE_RED, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //     LoadBitmap("Effect\\FireSnuff.jpg", BITMAP_FIRE_SNUFF, GL_LINEAR, GL_CLAMP_TO_EDGE);

        //     LoadWaveFile(SOUND_3RD_CHANGE_UP_BG_CAGE1, "Data\\Sound\\w42\\cage01.wav", 1);
        //     LoadWaveFile(SOUND_3RD_CHANGE_UP_BG_CAGE2, "Data\\Sound\\w42\\cage02.wav", 1);
        //     LoadWaveFile(SOUND_3RD_CHANGE_UP_BG_VOLCANO, "Data\\Sound\\w42\\volcano.wav", 1);
        //     LoadWaveFile(SOUND_3RD_CHANGE_UP_BG_FIREPILLAR, "Data\\Sound\\w42\\firepillar.wav", 1);
        //     break;
        // //     #ifndef PJH_NEW_SERVER_SELECT_MAP;
        // // case ENUM_WORLD.WD_77NEW_LOGIN_SCENE:
        // // case ENUM_WORLD.WD_78NEW_CHARACTER_SCENE:
        // //     if (activeWorld === ENUM_WORLD.WD_77NEW_LOGIN_SCENE) {
        // //         LoadBitmap("Logo\\New_Login_Back01.jpg", BITMAP_LOG_IN + 9);
        // //         LoadBitmap("Logo\\New_Login_Back02.jpg", BITMAP_LOG_IN + 10);
        // //         LoadBitmap("World78\\bg_b_05.jpg", BITMAP_CHROME + 3, GL_LINEAR, GL_REPEAT);
        // //         LoadBitmap("World78\\bg_b_08.jpg", BITMAP_CHROME + 4, GL_LINEAR, GL_REPEAT);
        // //         LoadBitmap("Logo\\MU-logo.tga", BITMAP_LOG_IN + 16, GL_LINEAR);
        // //         LoadBitmap("Logo\\MU-logo_g.jpg", BITMAP_LOG_IN + 17, GL_LINEAR);

        // //         // ���� �̸� �о����
        // //         OpenMonsterModel(129);
        // //         OpenMonsterModel(130);
        // //         OpenMonsterModel(131);
        // //         OpenMonsterModel(133);
        // //         OpenMonsterModel(135);
        // //     }
        // //     else {
        // //         LoadBitmap("Logo\\sos3sky01.jpg", BITMAP_LOG_IN + 9);
        // //         LoadBitmap("Logo\\sos3sky02.jpg", BITMAP_LOG_IN + 10);
        // //     }
        // //     #endif; //PJH_NEW_SERVER_SELECT_MAP
        // case ENUM_WORLD.WD_51HOME_6TH_CHAR:
        //     LoadBitmap("Effect\\clouds.jpg", BITMAP_CLOUD, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //     LoadBitmap("Effect\\Map_Smoke1.jpg", BITMAP_CHROME + 2, GL_LINEAR, GL_REPEAT);
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_EAGLE, "Data\\Object52\\", "sos3bi01");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_EAGLE, "Object52\\");
        //     if (activeWorld === ENUM_WORLD.WD_51HOME_6TH_CHAR) {
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_MAP_TORNADO, "Data\\Object52\\", "typhoonall");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_MAP_TORNADO, "Object52\\");

        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_TOTEMGOLEM_PART1, "Data\\Monster\\", "totemhead");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_TOTEMGOLEM_PART1, "Monster\\");
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_TOTEMGOLEM_PART2, "Data\\Monster\\", "totembody");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_TOTEMGOLEM_PART2, "Monster\\");
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_TOTEMGOLEM_PART3, "Data\\Monster\\", "totemleft");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_TOTEMGOLEM_PART3, "Monster\\");
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_TOTEMGOLEM_PART4, "Data\\Monster\\", "totemright");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_TOTEMGOLEM_PART4, "Monster\\");
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_TOTEMGOLEM_PART5, "Data\\Monster\\", "totemleg");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_TOTEMGOLEM_PART5, "Monster\\");
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_TOTEMGOLEM_PART6, "Data\\Monster\\", "totemleg2");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_TOTEMGOLEM_PART6, "Monster\\");

        //         LoadWaveFile(SOUND_ELBELAND_VILLAGEPROTECTION01, "Data\\Sound\\w52\\SE_Obj_villageprotection01.wav", 1);
        //         LoadWaveFile(SOUND_ELBELAND_WATERFALLSMALL01, "Data\\Sound\\w52\\SE_Obj_waterfallsmall01.wav", 1);
        //         LoadWaveFile(SOUND_ELBELAND_WATERWAY01, "Data\\Sound\\w52\\SE_Obj_waterway01.wav", 1);
        //         LoadWaveFile(SOUND_ELBELAND_ENTERDEVIAS01, "Data\\Sound\\w52\\SE_Obj_enterdevias01.wav", 1);
        //         LoadWaveFile(SOUND_ELBELAND_WATERSMALL01, "Data\\Sound\\w52\\SE_Obj_watersmall01.wav", 1);
        //         LoadWaveFile(SOUND_ELBELAND_RAVINE01, "Data\\Sound\\w52\\SE_Amb_ravine01.wav", 1);
        //         LoadWaveFile(SOUND_ELBELAND_ENTERATLANCE01, "Data\\Sound\\w52\\SE_Amb_enteratlance01.wav", 1);
        //     }
        //     break;
        // case ENUM_WORLD.WD_66DOPPLEGANGER2:
        //     {
        //         LoadBitmap("Effect\\clouds.jpg", BITMAP_CLOUD, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //         LoadBitmap("Effect\\FireSnuff.jpg", BITMAP_FIRE_SNUFF, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //         LoadBitmap("Effect\\WATERFALL2.jpg", BITMAP_CHROME3, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //         LoadBitmap("Effect\\clud64.jpg", BITMAP_CLUD64, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //     }
        //     break;
        // case ENUM_WORLD.WD_63PK_FIELD:
        //     {
        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_PKFIELD_ASSASSIN_EFFECT_GREEN_HEAD, "Data\\Monster\\", "pk_manhead_green");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_PKFIELD_ASSASSIN_EFFECT_GREEN_HEAD, "Monster\\");

        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_PKFIELD_ASSASSIN_EFFECT_RED_HEAD, "Data\\Monster\\", "pk_manhead_red");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_PKFIELD_ASSASSIN_EFFECT_RED_HEAD, "Monster\\");

        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_PKFIELD_ASSASSIN_EFFECT_GREEN_BODY, "Data\\Monster\\", "assassin_dieg");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_PKFIELD_ASSASSIN_EFFECT_GREEN_BODY, "Monster\\");

        //         await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_PKFIELD_ASSASSIN_EFFECT_RED_BODY, "Data\\Monster\\", "assassin_dier");
        //         await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_PKFIELD_ASSASSIN_EFFECT_RED_BODY, "Monster\\");
        //     }
        //     break;
        // case ENUM_WORLD.WD_56MAP_SWAMP_OF_QUIET:
        //     LoadBitmap("Effect\\Map_Smoke1.jpg", BITMAP_CHROME + 2, GL_LINEAR, GL_REPEAT);
        //     LoadBitmap("Effect\\Map_Smoke2.tga", BITMAP_CHROME + 3, GL_LINEAR, GL_REPEAT);
        //     LoadBitmap("Monster\\red_shadows.jpg", BITMAP_SHADOW_PAWN_RED, GL_LINEAR, GL_REPEAT);
        //     LoadBitmap("Monster\\blue_shadows.jpg", BITMAP_SHADOW_KINGHT_BLUE, GL_LINEAR, GL_REPEAT);
        //     LoadBitmap("Monster\\green_shadows.jpg", BITMAP_SHADOW_ROOK_GREEN, GL_LINEAR, GL_REPEAT);

        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_PAWN_ANKLE_LEFT, "Data\\Monster\\", "shadow_pawn_7_ankle_left");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_PAWN_ANKLE_LEFT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_PAWN_ANKLE_RIGHT, "Data\\Monster\\", "shadow_pawn_7_ankle_right");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_PAWN_ANKLE_RIGHT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_PAWN_BELT, "Data\\Monster\\", "shadow_pawn_7_belt");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_PAWN_BELT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_PAWN_CHEST, "Data\\Monster\\", "shadow_pawn_7_chest");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_PAWN_CHEST, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_PAWN_HELMET, "Data\\Monster\\", "shadow_pawn_7_helmet");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_PAWN_HELMET, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_PAWN_KNEE_LEFT, "Data\\Monster\\", "shadow_pawn_7_knee_left");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_PAWN_KNEE_LEFT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_PAWN_KNEE_RIGHT, "Data\\Monster\\", "shadow_pawn_7_knee_right");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_PAWN_KNEE_RIGHT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_PAWN_WRIST_LEFT, "Data\\Monster\\", "shadow_pawn_7_wrist_left");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_PAWN_WRIST_LEFT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_PAWN_WRIST_RIGHT, "Data\\Monster\\", "shadow_pawn_7_wrist_right");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_PAWN_WRIST_RIGHT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_KNIGHT_ANKLE_LEFT, "Data\\Monster\\", "shadow_knight_7_ankle_left");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_KNIGHT_ANKLE_LEFT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_KNIGHT_ANKLE_RIGHT, "Data\\Monster\\", "shadow_knight_7_ankle_right");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_KNIGHT_ANKLE_RIGHT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_KNIGHT_BELT, "Data\\Monster\\", "shadow_knight_7_belt");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_KNIGHT_BELT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_KNIGHT_CHEST, "Data\\Monster\\", "shadow_knight_7_chest");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_KNIGHT_CHEST, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_KNIGHT_HELMET, "Data\\Monster\\", "shadow_knight_7_helmet");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_KNIGHT_HELMET, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_KNIGHT_KNEE_LEFT, "Data\\Monster\\", "shadow_knight_7_knee_left");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_KNIGHT_KNEE_LEFT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_KNIGHT_KNEE_RIGHT, "Data\\Monster\\", "shadow_knight_7_knee_right");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_KNIGHT_KNEE_RIGHT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_KNIGHT_WRIST_LEFT, "Data\\Monster\\", "shadow_knight_7_wrist_left");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_KNIGHT_WRIST_LEFT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_KNIGHT_WRIST_RIGHT, "Data\\Monster\\", "shadow_knight_7_wrist_right");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_KNIGHT_WRIST_RIGHT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_ROOK_ANKLE_LEFT, "Data\\Monster\\", "shadow_rock_7_ankle_left");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_ROOK_ANKLE_LEFT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_ROOK_ANKLE_RIGHT, "Data\\Monster\\", "shadow_rock_7_ankle_right");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_ROOK_ANKLE_RIGHT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_ROOK_BELT, "Data\\Monster\\", "shadow_rock_7_belt");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_ROOK_BELT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_ROOK_CHEST, "Data\\Monster\\", "shadow_rock_7_chest");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_ROOK_CHEST, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_ROOK_HELMET, "Data\\Monster\\", "shadow_rock_7_helmet");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_ROOK_HELMET, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_ROOK_KNEE_LEFT, "Data\\Monster\\", "shadow_rock_7_knee_left");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_ROOK_KNEE_LEFT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_ROOK_KNEE_RIGHT, "Data\\Monster\\", "shadow_rock_7_knee_right");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_ROOK_KNEE_RIGHT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_ROOK_WRIST_LEFT, "Data\\Monster\\", "shadow_rock_7_wrist_left");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_ROOK_WRIST_LEFT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHADOW_ROOK_WRIST_RIGHT, "Data\\Monster\\", "shadow_rock_7_wrist_right");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SHADOW_ROOK_WRIST_RIGHT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_EX01_SHADOW_MASTER_ANKLE_LEFT, "Data\\Monster\\", "ex01shadow_rock_7_ankle_left");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_EX01_SHADOW_MASTER_ANKLE_LEFT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_EX01_SHADOW_MASTER_ANKLE_RIGHT, "Data\\Monster\\", "ex01shadow_rock_7_ankle_right");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_EX01_SHADOW_MASTER_ANKLE_RIGHT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_EX01_SHADOW_MASTER_BELT, "Data\\Monster\\", "ex01shadow_rock_7_belt");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_EX01_SHADOW_MASTER_BELT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_EX01_SHADOW_MASTER_CHEST, "Data\\Monster\\", "ex01shadow_rock_7_chest");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_EX01_SHADOW_MASTER_CHEST, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_EX01_SHADOW_MASTER_HELMET, "Data\\Monster\\", "ex01shadow_rock_7_helmet");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_EX01_SHADOW_MASTER_HELMET, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_EX01_SHADOW_MASTER_KNEE_LEFT, "Data\\Monster\\", "ex01shadow_rock_7_knee_left");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_EX01_SHADOW_MASTER_KNEE_LEFT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_EX01_SHADOW_MASTER_KNEE_RIGHT, "Data\\Monster\\", "ex01shadow_rock_7_knee_right");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_EX01_SHADOW_MASTER_KNEE_RIGHT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_EX01_SHADOW_MASTER_WRIST_LEFT, "Data\\Monster\\", "ex01shadow_rock_7_wrist_left");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_EX01_SHADOW_MASTER_WRIST_LEFT, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_EX01_SHADOW_MASTER_WRIST_RIGHT, "Data\\Monster\\", "ex01shadow_rock_7_wrist_right");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_EX01_SHADOW_MASTER_WRIST_RIGHT, "Monster\\");
        //     break;
        // case ENUM_WORLD.WD_65DOPPLEGANGER1:
        //     LoadBitmap("Effect\\clouds.jpg", BITMAP_CLOUD, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //     LoadBitmap("Effect\\Map_Smoke1.jpg", BITMAP_CHROME + 2, GL_LINEAR, GL_REPEAT);
        //     LoadBitmap("Object9\\sand02.jpg", BITMAP_CHROME + 3, GL_LINEAR, GL_REPEAT);
        //     LoadBitmap("Effect\\Chrome08.jpg", BITMAP_CHROME8, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //     break;
        // case ENUM_WORLD.WD_57ICECITY:
        // case ENUM_WORLD.WD_58ICECITY_BOSS:
        //     LoadBitmap("Effect\\Map_Smoke1.jpg", BITMAP_CHROME + 2, GL_LINEAR, GL_REPEAT);
        //     LoadBitmap("Object9\\sand02.jpg", BITMAP_CHROME + 3, GL_LINEAR, GL_REPEAT);
        //     LoadBitmap("Effect\\Chrome08.jpg", BITMAP_CHROME8, GL_LINEAR, GL_CLAMP_TO_EDGE);

        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_FALL_STONE_EFFECT, "Data\\Object47\\", "Stoneeffec");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_FALL_STONE_EFFECT, "Object47\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_WARP, "Data\\Npc\\", "warp01");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_WARP2, "Data\\Npc\\", "warp02");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_WARP3, "Data\\Npc\\", "warp03");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_WARP, "Npc\\");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_WARP2, "Npc\\");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_WARP3, "Npc\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_WARP4, "Data\\Npc\\", "warp01");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_WARP5, "Data\\Npc\\", "warp02");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_WARP6, "Data\\Npc\\", "warp03");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_WARP4, "Npc\\");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_WARP5, "Npc\\");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_WARP6, "Npc\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SUMMON, "Data\\SKill\\", "nightmaresum");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_SUMMON, "SKill\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_STORM2, "Data\\SKill\\", "boswind");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_STORM2, "SKill\\");

        //     LoadWaveFile(SOUND_KANTURU_3RD_MAYAHAND_ATTACK2, "Data\\Sound\\w39\\maya_hand_attack-02.wav", 1);

        //     // vec3_t vPos, vAngle;
        //     //     if (activeWorld === ENUM_WORLD.WD_57ICECITY) {
        //     //         Vector(0, 0, 35, vAngle);
        //     //         Vector(0, 0, 0, vPos);
        //     //         vPos[0] = 162 * TERRAIN_SCALE;
        //     //         vPos[1] = 83 * TERRAIN_SCALE;
        //     //         CreateObject(ENUM_OBJECTS.MODEL_WARP, vPos, vAngle);

        //     //         Vector(0, 0, 80, vAngle);
        //     //         Vector(0, 0, 0, vPos);
        //     //         vPos[0] = 171 * TERRAIN_SCALE;
        //     //         vPos[1] = 24 * TERRAIN_SCALE;
        //     //         CreateObject(ENUM_OBJECTS.MODEL_WARP4, vPos, vAngle);
        //     //     }
        //     //     else if (activeWorld === ENUM_WORLD.WD_58ICECITY_BOSS) {
        //     //         Vector(0, 0, 85, vAngle);
        //     //         Vector(0, 0, 0, vPos);
        //     //         vPos[0] = 169 * TERRAIN_SCALE;
        //     //         vPos[1] = 24 * TERRAIN_SCALE;
        //     //         CreateObject(ENUM_OBJECTS.MODEL_WARP4, vPos, vAngle);

        //     //         Vector(0, 0, 85, vAngle);
        //     //         Vector(0, 0, 0, vPos);
        //     //         vPos[0] = 170 * TERRAIN_SCALE;
        //     //         vPos[1] = 24 * TERRAIN_SCALE;
        //     //         CreateObject(ENUM_OBJECTS.MODEL_WARP4, vPos, vAngle);
        //     //     }
        //     break;

        // case ENUM_WORLD.WD_69EMPIREGUARDIAN1:
        // case ENUM_WORLD.WD_70EMPIREGUARDIAN2:
        // case ENUM_WORLD.WD_71EMPIREGUARDIAN3:
        // case ENUM_WORLD.WD_72EMPIREGUARDIAN4:
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_PROJECTILE, "Data\\Effect\\", "choarms_06");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_PROJECTILE, "Effect\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE01, "Data\\Effect\\", "piece01_01");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE02, "Data\\Effect\\", "piece01_02");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE03, "Data\\Effect\\", "piece01_03");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE04, "Data\\Effect\\", "piece01_04");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE05, "Data\\Effect\\", "piece01_05");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE06, "Data\\Effect\\", "piece01_06");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE07, "Data\\Effect\\", "piece01_07");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE08, "Data\\Effect\\", "piece01_08");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE09, "Data\\Effect\\", "newdoor_break_01");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE01, "Effect\\");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE02, "Effect\\");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE03, "Effect\\");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE04, "Effect\\");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE05, "Effect\\");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE06, "Effect\\");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE07, "Effect\\");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE08, "Effect\\");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE09, "Effect\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_STATUE_CRUSH_EFFECT_PIECE01, "Data\\Effect\\", "NpcGagoil_Crack01");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_STATUE_CRUSH_EFFECT_PIECE02, "Data\\Effect\\", "NpcGagoil_Crack02");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_STATUE_CRUSH_EFFECT_PIECE03, "Data\\Effect\\", "NpcGagoil_Crack03");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_STATUE_CRUSH_EFFECT_PIECE04, "Data\\Effect\\", "NpcGagoil_Ruin");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_STATUE_CRUSH_EFFECT_PIECE01, "Effect\\");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_STATUE_CRUSH_EFFECT_PIECE02, "Effect\\");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_STATUE_CRUSH_EFFECT_PIECE03, "Effect\\");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_STATUE_CRUSH_EFFECT_PIECE04, "Effect\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE10, "Data\\Effect\\", "sojghmoon02");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE11, "Data\\Effect\\", "sojghmj01");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE12, "Data\\Effect\\", "sojghmj02");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE13, "Data\\Effect\\", "sojghmj03");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE10, "Effect\\");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE11, "Effect\\");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE12, "Effect\\");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_DOOR_CRUSH_EFFECT_PIECE13, "Effect\\");

        //     LoadBitmap("Effect\\clouds.jpg", BITMAP_CLOUD, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //     LoadBitmap("Effect\\flare.jpg", BITMAP_FLARE, GL_LINEAR, GL_CLAMP_TO_EDGE);
        //     LoadBitmap("Effect\\Map_Smoke1.jpg", BITMAP_CHROME + 2, GL_LINEAR, GL_REPEAT);

        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_WEATHER_RAIN, "Data\\Sound\\w69w70w71w72\\ImperialGuardianFort_out1.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_WEATHER_FOG, "Data\\Sound\\w69w70w71w72\\ImperialGuardianFort_out2.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_WEATHER_STORM, "Data\\Sound\\w69w70w71w72\\ImperialGuardianFort_out3.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_INDOOR_SOUND, "Data\\Sound\\w69w70w71w72\\ImperialGuardianFort_in.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_BOSS_GAION_MONSTER_MOVE, "Data\\Sound\\w69w70w71w72\\GaionKalein_move.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_BOSS_GAION_MONSTER_RAGE, "Data\\Sound\\w69w70w71w72\\GaionKalein_rage.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_BOSS_GAION_MONSTER_DEATH, "Data\\Sound\\w69w70w71w72\\GrandWizard_death.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_JERINT_MONSTER_ATTACK01, "Data\\Sound\\w69w70w71w72\\Jelint_attack1.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_JERINT_MONSTER_ATTACK03, "Data\\Sound\\w69w70w71w72\\Jelint_attack3.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_JERINT_MONSTER_MOVE01, "Data\\Sound\\w69w70w71w72\\Jelint_move01.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_JERINT_MONSTER_MOVE02, "Data\\Sound\\w69w70w71w72\\Jelint_move02.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_JERINT_MONSTER_RAGE, "Data\\Sound\\w69w70w71w72\\Jelint_rage.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_JERINT_MONSTER_DEATH, "Data\\Sound\\w69w70w71w72\\Jelint_death.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_RAYMOND_MONSTER_ATTACK02, "Data\\Sound\\w69w70w71w72\\Raymond_attack2.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_RAYMOND_MONSTER_RAGE, "Data\\Sound\\w69w70w71w72\\Raymond_rage.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_ERCANNE_MONSTER_ATTACK03, "Data\\Sound\\w69w70w71w72\\Ercanne_attack3.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_1CORP_DEASULER_MONSTER_ATTACK02, "Data\\Sound\\w69w70w71w72\\1Deasuler_attack2.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_1CORP_DEASULER_MONSTER_ATTACK03, "Data\\Sound\\w69w70w71w72\\1Deasuler_attack3.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_2CORP_VERMONT_MONSTER_ATTACK01, "Data\\Sound\\w69w70w71w72\\2Vermont_attack1.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_2CORP_VERMONT_MONSTER_ATTACK02, "Data\\Sound\\w69w70w71w72\\2Vermont_attack2.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_2CORP_VERMONT_MONSTER_DEATH, "Data\\Sound\\w69w70w71w72\\2Vermont_death.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_3CORP_CATO_ATTACK02, "Data\\Sound\\w69w70w71w72\\3Cato_attack2.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_3CORP_CATO_MOVE, "Data\\Sound\\w69w70w71w72\\3Cato_move.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_4CORP_GALLIA_ATTACK02, "Data\\Sound\\w69w70w71w72\\4Gallia_attack2.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_QUATERMASTER_ATTACK02, "Data\\Sound\\w69w70w71w72\\QuaterMaster_attack2.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_COMBATMASTER_ATTACK01, "Data\\Sound\\w69w70w71w72\\CombatMaster_attack1.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_COMBATMASTER_ATTACK02, "Data\\Sound\\w69w70w71w72\\CombatMaster_attack2.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_COMBATMASTER_ATTACK03, "Data\\Sound\\w69w70w71w72\\CombatMaster_attack3.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_GRANDWIZARD_DEATH, "Data\\Sound\\w69w70w71w72\\GrandWizard_death.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_ASSASSINMASTER_DEATH, "Data\\Sound\\w69w70w71w72\\AssassinMaster_Death.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_CAVALRYLEADER_ATTACK01, "Data\\Sound\\w69w70w71w72\\CavalryLeader_attack1.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_CAVALRYLEADER_ATTACK02, "Data\\Sound\\w69w70w71w72\\CavalryLeader_attack2.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_CAVALRYLEADER_MOVE01, "Data\\Sound\\w69w70w71w72\\CavalryLeader_move01.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_CAVALRYLEADER_MOVE02, "Data\\Sound\\w69w70w71w72\\CavalryLeader_move02.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_DEFENDER_ATTACK02, "Data\\Sound\\w69w70w71w72\\GrandWizard_death.wav");
        //     LoadWaveFile(SOUND_EMPIREGUARDIAN_PRIEST_STOP, "Data\\Sound\\w69w70w71w72\\Priest_stay.wav");
        //     break;
        // case ENUM_WORLD.WD_73NEW_LOGIN_SCENE:
        // case ENUM_WORLD.WD_74NEW_CHARACTER_SCENE:
        //     {
        //         LoadBitmap("Logo\\MU-logo.tga", BITMAP_LOG_IN + 16, GL_LINEAR);
        //         LoadBitmap("Logo\\MU-logo_g.jpg", BITMAP_LOG_IN + 17, GL_LINEAR);
        //     }
        //     break;
        // case ENUM_WORLD.WD_55LOGINSCENE:
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_DRAGON, "Data\\Object56\\", "Dragon");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_DRAGON, "Object56\\");

        //     Vector(0, 0, 0, Ang);
        //     Vector(0, 0, 0, Pos);
        //     Pos[0] = 56 * TERRAIN_SCALE; Pos[1] = 230 * TERRAIN_SCALE;
        //     CreateObject(ENUM_OBJECTS.MODEL_DRAGON, Pos, Ang);
        //     break;

        // // #ifdef ASG_ADD_KARUTAN_MONSTERS;
        // case ENUM_WORLD.WD_80KARUTAN1:
        // case ENUM_WORLD.WD_81KARUTAN2:
        //     LoadBitmap("Object9\\sand02.jpg", BITMAP_CHROME + 3, GL_LINEAR, GL_REPEAT);
        //     LoadBitmap("Effect\\clouds.jpg", BITMAP_CLOUD, GL_LINEAR, GL_CLAMP_TO_EDGE);

        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CONDRA_ARM_L, "Data\\Monster\\", "condra_7_arm_left");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CONDRA_ARM_L, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CONDRA_ARM_L2, "Data\\Monster\\", "condra_7_arm_left_2");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CONDRA_ARM_L2, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CONDRA_SHOULDER, "Data\\Monster\\", "condra_7_shoulder_right");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CONDRA_SHOULDER, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CONDRA_ARM_R, "Data\\Monster\\", "condra_7_arm_right");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CONDRA_ARM_R, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CONDRA_ARM_R2, "Data\\Monster\\", "condra_7_arm_right_2");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CONDRA_ARM_R2, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CONDRA_CONE_L, "Data\\Monster\\", "condra_7_cone_left");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CONDRA_CONE_L, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CONDRA_CONE_R, "Data\\Monster\\", "condra_7_cone_right");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CONDRA_CONE_R, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CONDRA_PELVIS, "Data\\Monster\\", "condra_7_pelvis");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CONDRA_PELVIS, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CONDRA_STOMACH, "Data\\Monster\\", "condra_7_stomach");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CONDRA_STOMACH, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CONDRA_NECK, "Data\\Monster\\", "condra_7_neck");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CONDRA_NECK, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_NARCONDRA_ARM_L, "Data\\Monster\\", "nar_condra_7_arm_left");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_NARCONDRA_ARM_L, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_NARCONDRA_ARM_L2, "Data\\Monster\\", "nar_condra_7_arm_left_2");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_NARCONDRA_ARM_L2, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_NARCONDRA_SHOULDER_L, "Data\\Monster\\", "nar_condra_7_shoulder_left");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_NARCONDRA_SHOULDER_L, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_NARCONDRA_SHOULDER_R, "Data\\Monster\\", "nar_condra_7_shoulder_right");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_NARCONDRA_SHOULDER_R, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_NARCONDRA_ARM_R, "Data\\Monster\\", "nar_condra_7_arm_right");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_NARCONDRA_ARM_R, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_NARCONDRA_ARM_R2, "Data\\Monster\\", "nar_condra_7_arm_right_2");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_NARCONDRA_ARM_R2, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_NARCONDRA_ARM_R3, "Data\\Monster\\", "nar_condra_7_arm_right_3");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_NARCONDRA_ARM_R3, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_NARCONDRA_CONE_1, "Data\\Monster\\", "nar_condra_7_cone_1");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_NARCONDRA_CONE_1, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_NARCONDRA_CONE_2, "Data\\Monster\\", "nar_condra_7_cone_2");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_NARCONDRA_CONE_2, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_NARCONDRA_CONE_3, "Data\\Monster\\", "nar_condra_7_cone_3");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_NARCONDRA_CONE_3, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_NARCONDRA_CONE_4, "Data\\Monster\\", "nar_condra_7_cone_4");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_NARCONDRA_CONE_4, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_NARCONDRA_CONE_5, "Data\\Monster\\", "nar_condra_7_cone_5");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_NARCONDRA_CONE_5, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_NARCONDRA_CONE_6, "Data\\Monster\\", "nar_condra_7_cone_6");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_NARCONDRA_CONE_6, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_NARCONDRA_PELVIS, "Data\\Monster\\", "nar_condra_7_pelvis");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_NARCONDRA_PELVIS, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_NARCONDRA_STOMACH, "Data\\Monster\\", "nar_condra_7_stomach");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_NARCONDRA_STOMACH, "Monster\\");
        //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_NARCONDRA_NECK, "Data\\Monster\\", "nar_condra_7_neck");
        //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_NARCONDRA_NECK, "Monster\\");

        //     LoadWaveFile(SOUND_KARUTAN_DESERT_ENV, "Data\\Sound\\Karutan\\Karutan_desert_env.wav", 1);
        //     LoadWaveFile(SOUND_KARUTAN_INSECT_ENV, "Data\\Sound\\Karutan\\Karutan_insect_env.wav", 1);
        //     LoadWaveFile(SOUND_KARUTAN_KARDAMAHAL_ENV, "Data\\Sound\\Karutan\\Kardamahal_entrance_env.wav", 1);
        //     break;
        // // #endif;	// ASG_ADD_KARUTAN_MONSTERS
        default: {
            throw new Error(`need to implement!`);
        }
    }

    // if (this.InChaosCastle() == true) {
    //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_ANGEL, "Data\\Player\\", "Angel");
    //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_ANGEL, "Npc\\");

    //     LoadBitmap("Effect/clouds.jpg", BITMAP_CLOUD, GL_LINEAR, GL_CLAMP_TO_EDGE);

    //     LoadWaveFile(SOUND_CHAOSCASTLE, "Data\\Sound\\iChaosCastle.wav", 1);
    // }

    // if (this.InHellas()) {
    //     LoadBitmap("Object25/water1.tga", BITMAP_MAPTILE, GL_LINEAR, GL_REPEAT, false);
    //     LoadBitmap("Object25/water2.jpg", BITMAP_MAPTILE + 1, GL_NEAREST, GL_CLAMP_TO_EDGE);

    //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CUNDUN_PART1, "Data\\Monster\\", "cd71a", -1);
    //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CUNDUN_PART1, "Monster\\");
    //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CUNDUN_PART2, "Data\\Monster\\", "cd71b", -1);
    //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CUNDUN_PART2, "Monster\\");
    //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CUNDUN_PART3, "Data\\Monster\\", "cd71c", -1);
    //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CUNDUN_PART3, "Monster\\");
    //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CUNDUN_PART4, "Data\\Monster\\", "cd71d", -1);
    //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CUNDUN_PART4, "Monster\\");
    //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CUNDUN_PART5, "Data\\Monster\\", "cd71e", -1);
    //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CUNDUN_PART5, "Monster\\");
    //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CUNDUN_PART6, "Data\\Monster\\", "cd71f", -1);
    //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CUNDUN_PART6, "Monster\\");
    //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CUNDUN_PART7, "Data\\Monster\\", "cd71g", -1);
    //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CUNDUN_PART7, "Monster\\");
    //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CUNDUN_PART8, "Data\\Monster\\", "cd71h", -1);
    //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CUNDUN_PART8, "Monster\\");
    //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CUNDUN_DRAGON_HEAD, "Data\\Skill\\", "dragonhead", -1);
    //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CUNDUN_DRAGON_HEAD, "Skill\\");
    //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CUNDUN_PHOENIX, "Data\\Skill\\", "phoenix", -1);
    //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CUNDUN_PHOENIX, "Skill\\");
    //     await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CUNDUN_GHOST, "Data\\Monster\\", "cundun_gone", -1);
    //     await gLoadData.OpenTexture(ENUM_OBJECTS.MODEL_CUNDUN_GHOST, "Monster\\");
    //     Models[MODEL_CUNDUN_PART6].Actions[0].Loop = false;
    //     Models[MODEL_CUNDUN_PART6].Actions[0].PlaySpeed = 0.13;
    //     Models[MODEL_CUNDUN_PART7].Actions[0].Loop = false;
    //     Models[MODEL_CUNDUN_PART7].Actions[0].PlaySpeed = 0.13;
    //     Models[MODEL_CUNDUN_PHOENIX].Actions[0].Loop = true;
    //     Models[MODEL_CUNDUN_GHOST].Actions[0].Loop = false;

    //     LoadWaveFile(SOUND_KALIMA_AMBIENT, "Data\\Sound\\aKalima.wav", 1);
    //     LoadWaveFile(SOUND_KALIMA_AMBIENT2, "Data\\Sound\\aKalima01.wav", 1);
    //     LoadWaveFile(SOUND_KALIMA_AMBIENT3, "Data\\Sound\\aKalima02.wav", 1);
    //     LoadWaveFile(SOUND_KALIMA_WATER_FALL, "Data\\Sound\\aKalimaWaterFall.wav", 3);
    //     LoadWaveFile(SOUND_KALIMA_FALLING_STONE, "Data\\Sound\\aKalimaStone.wav", 3);
    //     LoadWaveFile(SOUND_DEATH_BUBBLE, "Data\\Sound\\mDeathBubble.wav", 1);

    //     LoadWaveFile(SOUND_KUNDUN_AMBIENT1, "Data\\Sound\\mKundunAmbient1.wav", 1);
    //     LoadWaveFile(SOUND_KUNDUN_AMBIENT2, "Data\\Sound\\mKundunAmbient2.wav", 1);
    //     LoadWaveFile(SOUND_KUNDUN_ROAR, "Data\\Sound\\mKundunRoar.wav", 1);
    //     LoadWaveFile(SOUND_KUNDUN_SIGHT, "Data\\Sound\\mKundunSight.wav", 1);
    //     LoadWaveFile(SOUND_KUNDUN_SHUDDER, "Data\\Sound\\mKundunShudder.wav", 1);
    //     LoadWaveFile(SOUND_KUNDUN_DESTROY, "Data\\Sound\\mKundunDestory.wav", 1);

    //     LoadWaveFile(SOUND_SKILL_SKULL, "Data\\Sound\\eSkull.wav", 1);
    //     LoadWaveFile(SOUND_GREAT_POISON, "Data\\Sound\\eGreatPoison.wav", 1);
    //     LoadWaveFile(SOUND_GREAT_SHIELD, "Data\\Sound\\eGreatShield.wav", 1);
    // }

    if (activeWorld !== ENUM_WORLD.WD_7ATLANSE) {
        for (let i = 0; i < 32; i++) {
            const FileName = `Object8/wt${padZero(i)}.jpg`;

            LoadBitmap(FileName, BITMAP_WATER + i, GL_LINEAR, GL_REPEAT, false);
        }
    }

    LoadBitmap("Object8/light01.jpg", BITMAP_SHINES, GL_LINEAR, GL_REPEAT);

    if (activeWorld == 0) {
        for (i = 0; i < 13; i++)
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_TREE01 + i, "./data/Object1/", "Tree", i + 1);
        for (i = 0; i < 8; i++)
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_GRASS01 + i, "./data/Object1/", "Grass", i + 1);
        for (i = 0; i < 5; i++)
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_STONE01 + i, "./data/Object1/", "Stone", i + 1);

        for (i = 0; i < 3; i++)
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_STONE_STATUE01 + i, "./data/Object1/", "StoneStatue", i + 1);
        await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_STEEL_STATUE, "./data/Object1/", "SteelStatue", 1);
        for (i = 0; i < 3; i++)
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_TOMB01 + i, "./data/Object1/", "Tomb", i + 1);
        for (i = 0; i < 2; i++)
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_FIRE_LIGHT01 + i, "./data/Object1/", "FireLight", i + 1);
        await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_BONFIRE, "./data/Object1/", "Bonfire", 1);
        await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_DUNGEON_GATE, "./data/Object1/", "DoungeonGate", 1);
        await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_TREASURE_DRUM, "./data/Object1/", "TreasureDrum", 1);
        await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_TREASURE_CHEST, "./data/Object1/", "TreasureChest", 1);
        await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SHIP, "./data/Object1/", "Ship", 1);

        for (i = 0; i < 6; i++)
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_STONE_WALL01 + i, "./data/Object1/", "StoneWall", i + 1);
        for (i = 0; i < 4; i++)
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_MU_WALL01 + i, "./data/Object1/", "StoneMuWall", i + 1);
        for (i = 0; i < 3; i++)
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_STEEL_WALL01 + i, "./data/Object1/", "SteelWall", i + 1);
        await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_STEEL_DOOR, "./data/Object1/", "SteelDoor", 1);
        for (i = 0; i < 3; i++)
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CANNON01 + i, "./data/Object1/", "Cannon", i + 1);
        await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_BRIDGE, "./data/Object1/", "Bridge", 1);
        for (i = 0; i < 4; i++)
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_FENCE01 + i, "./data/Object1/", "Fence", i + 1);
        await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_BRIDGE_STONE, "./data/Object1/", "BridgeStone", 1);

        await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_STREET_LIGHT, "./data/Object1/", "StreetLight", 1);
        await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CURTAIN, "./data/Object1/", "Curtain", 1);
        for (i = 0; i < 4; i++)
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CARRIAGE01 + i, "./data/Object1/", "Carriage", i + 1);
        for (i = 0; i < 2; i++)
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_STRAW01 + i, "./data/Object1/", "Straw", i + 1);
        for (i = 0; i < 2; i++)
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_SIGN01 + i, "./data/Object1/", "Sign", i + 1);
        for (i = 0; i < 2; i++)
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_MERCHANT_ANIMAL01 + i, "./data/Object1/", "MerchantAnimal", i + 1);
        await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_WATERSPOUT, "./data/Object1/", "Waterspout", 1);
        for (i = 0; i < 4; i++)
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_WELL01 + i, "./data/Object1/", "Well", i + 1);
        await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_HANGING, "./data/Object1/", "Hanging", 1);

        for (i = 0; i < 5; i++)
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_HOUSE01 + i, "./data/Object1/", "House", i + 1);
        await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_TENT, "./data/Object1/", "Tent", 1);
        await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_STAIR, "./data/Object1/", "Stair", 1);

        for (i = 0; i < 6; i++)
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_HOUSE_WALL01 + i, "./data/Object1/", "HouseWall", i + 1);
        for (i = 0; i < 3; i++)
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_HOUSE_ETC01 + i, "./data/Object1/", "HouseEtc", i + 1);
        for (i = 0; i < 3; i++)
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_LIGHT01 + i, "./data/Object1/", "Light", i + 1);
        await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_POSE_BOX, "./data/Object1/", "PoseBox", 1);

        for (i = 0; i < 7; i++)
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_FURNITURE01 + i, "./data/Object1/", "Furniture", i + 1);
        await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_CANDLE, "./data/Object1/", "Candle", 1);
        for (i = 0; i < 3; i++)
            await gLoadData.AccessModel(ENUM_OBJECTS.MODEL_BEER01 + i, "./data/Object1/", "Beer", i + 1);

        for (i = ENUM_OBJECTS.MODEL_WORLD_OBJECT; i < ENUM_OBJECTS.MAX_WORLD_OBJECTS; i++)
            await gLoadData.OpenTexture(i, "Object1/");
    }
    else {
        let iMapWorld = activeWorld + 1;

        // if (this.InBloodCastle() == true) {
        //     iMapWorld = ENUM_WORLD.WD_11BLOODCASTLE1 + 1;
        // }
        // else if (this.InChaosCastle() == true) {
        //     iMapWorld = ENUM_WORLD.WD_18CHAOS_CASTLE + 1;
        // }
        // else if (this.InHellas() == true) {
        //     iMapWorld = ENUM_WORLD.WD_24HELLAS + 1;
        // }
        // else if (gMapManager.IsCursedTemple()) {
        //     iMapWorld = ENUM_WORLD.WD_45CURSEDTEMPLE_LV1 + 2;
        // }

        let DirName = `./data/Object${iMapWorld}/`;

        for (i = ENUM_OBJECTS.MODEL_WORLD_OBJECT; i < ENUM_OBJECTS.MAX_WORLD_OBJECTS; i++)
            await gLoadData.AccessModel(i, DirName, "Object", i + 1);


        DirName += `Object${iMapWorld}/`;
        for (i = ENUM_OBJECTS.MODEL_WORLD_OBJECT; i < ENUM_OBJECTS.MAX_WORLD_OBJECTS; i++) {
            await gLoadData.OpenTexture(i, DirName);
        }

        //         if (activeWorld === ENUM_WORLD.WD_1DUNGEON) {
        //             Models[40].Actions[1].PlaySpeed = 0.4f;
        //         }
        //         else if (activeWorld === ENUM_WORLD.WD_8TARKAN) {
        //             Models[11].StreamMesh = 0;
        //             Models[12].StreamMesh = 0;
        //             Models[13].StreamMesh = 0;
        //             Models[73].StreamMesh = 0;
        //             Models[75].StreamMesh = 0;
        //             Models[79].StreamMesh = 0;
        //         }
        //         if (activeWorld === ENUM_WORLD.WD_51HOME_6TH_CHAR
        // #ifndef PJH_NEW_SERVER_SELECT_MAP
        //             || activeWorld === ENUM_WORLD.WD_77NEW_LOGIN_SCENE
        //             || activeWorld === ENUM_WORLD.WD_78NEW_CHARACTER_SCENE;
        //         #endif; //PJH_NEW_SERVER_SELECT_MAP
        //             )
        //         {
        //             Models[MODEL_EAGLE].Actions[0].PlaySpeed = 0.5f;
        //             if (activeWorld === ENUM_WORLD.WD_51HOME_6TH_CHAR) {
        //                 Models[MODEL_MAP_TORNADO].Actions[0].PlaySpeed = 0.1f;
        //             }
        //         }
        //         else if (activeWorld === ENUM_WORLD.WD_57ICECITY) {
        //             Models[16].Actions[0].PlaySpeed = 0.8f;
        //             Models[16].Actions[1].PlaySpeed = 0.8f;
        //             Models[17].Actions[0].PlaySpeed = 0.8f;
        //             Models[17].Actions[1].PlaySpeed = 0.8f;
        //             Models[17].Actions[2].PlaySpeed = 1;
        //             Models[17].Actions[3].PlaySpeed = 1;

        //             Models[68].Actions[0].PlaySpeed = 0.05f;
        //         }
        //         #ifdef ASG_ADD_MAP_KARUTAN
        //         else if (IsKarutanMap()) {
        //             Models[66].Actions[0].PlaySpeed = 0.15f;
        //             Models[66].Actions[1].PlaySpeed = 0.15f;

        //             Models[107].Actions[0].PlaySpeed = 5;
        //         }
        //         #endif;	// ASG_ADD_MAP_KARUTAN
    }
}