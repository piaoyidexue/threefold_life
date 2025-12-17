
/** src/common/net_table_interfaces.d.ts
 * 这里定义所有网表数据的具体接口。
 * 使用 declare namespace 避免污染全局命名空间，且无需 import/export 即可在 d.ts 中使用
 */
declare namespace NetTableDef {

    // --- 示例：游戏全局设置 ---
    interface GameSettings {
        is_ranking_active: boolean;
        difficulty_multiplier: number;
        game_mode: 'standard' | 'survival' | 'sandbox';
        max_kills_to_win: number;
    }

    // --- 示例：玩家动态数据 ---
    interface PlayerData {
        steam_id: string;
        hero_entity_index: number;
        gold: number;
        lumber: number;
        is_ready:  boolean ;
        talent_tree: number[]; // 比如天赋ID数组
        alive: boolean;
        playerId: PlayerID;
        hp: number;
        level: number;
        traitor_data : { shards: number }
    }

    // --- 示例：RPG 英雄/单位属性 ---
    interface UnitAttributes {
        strength: number;
        agility: number;
        intellect: number;
        attack_damage: number;
        spell_amp: number;
        elemental_type: 'fire' | 'water' | 'earth';
    }
     interface GameContext {
        round: number
        phase: string
        phase_end_time: number
        activePlayers: number[]
        remainingUnits: Record<number, number>
    }
}
