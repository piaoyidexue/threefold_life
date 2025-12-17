// 引用上面的定义文件（如果编辑器没自动识别）
/// <reference path="./net_table_interfaces.d.ts" />


/*** src/common/custom_net_tables.d.ts
 * 核心工具类型：定义网表的三种常见模式
 */
type NetTableMap<T> = { [key: string]: T };   // 基础字典
type EntityMap<T> = { [entityIndex: string]: T }; // 键为 EntityIndex
type PlayerMap<T> = { [playerID: string]: T };    // 键为 PlayerID


interface CustomNetTableDeclarations {

    // 1. 全局配置表
    // 键通常是固定的，比如 "settings", "state"
    game_state: {
        settings: NetTableDef.GameSettings;
        match_info: { match_id: string; start_time: number };
        context: NetTableDef.GameContext;
        radiance : number;

    };

    // 2. 玩家数据表
    // 键是 PlayerID (0, 1, 2...)
    player_data: PlayerMap<NetTableDef.PlayerData>;

    // 3. 单位属性表
    // 键是 EntityIndex
    unit_attributes: EntityMap<NetTableDef.UnitAttributes>;

    // 4. 排行榜/其他动态键值
    leaderboard: NetTableMap<{ score: number; name: string }>;
}


