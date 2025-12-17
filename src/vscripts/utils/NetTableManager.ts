/**
 * 后端网表管理器
 * 提供类型安全的 Set 和 Get 方法
 */
export class NetTableManager {

    /**
     * 设置网表值 (全自动类型推断)
     * @param tableName 表名 (只能是 custom_net_tables.d.ts 中定义的 key)
     * @param key 键名
     * @param value 数据 (必须符合定义的数据结构)
     */
    static Set<TName extends keyof CustomNetTableDeclarations, TKey extends keyof CustomNetTableDeclarations[TName]>(
        tableName: TName,
        key: TKey,
        value: CustomNetTableDeclarations[TName][TKey]
    ): void {
        // 核心：调用底层 API，TSTL 会自动处理类型擦除
        CustomNetTables.SetTableValue(tableName, key, value);
    }

    /**
     * 设置玩家相关的数据 (自动转换 PlayerID 到 string)
     */
    static SetPlayerData<TKey extends keyof CustomNetTableDeclarations['player_data']>(
        playerID: PlayerID,
        data: CustomNetTableDeclarations['player_data'][string] // 这里取值的类型
    ): void {
        CustomNetTables.SetTableValue("player_data", tostring(playerID), data);
    }

    /**
     * 设置单位相关的数据 (自动转换 EntityIndex 到 string)
     */
    static SetUnitData(entity: CDOTA_BaseNPC, data: NetTableDef.UnitAttributes): void {
        CustomNetTables.SetTableValue("unit_attributes", tostring(entity.GetEntityIndex()), data);
    }

    /**
     * 获取数据（后端通常有本地缓存，但有时也需要从网表回读）
     */
    static Get<TName extends keyof CustomNetTableDeclarations, TKey extends keyof CustomNetTableDeclarations[TName]>(
        tableName: TName,
        key: TKey
    ): CustomNetTableDeclarations[TName][TKey] | undefined {
        return CustomNetTables.GetTableValue(tableName, key) as any;
    }
}
