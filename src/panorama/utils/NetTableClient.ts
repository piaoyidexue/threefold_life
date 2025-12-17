/** src/panorama/utils/NetTableClient.ts
 * 前端网表客户端
 */
export namespace NetTableClient {

    /**
     * 获取网表数据
     * @returns 数据对象 或 undefined (如果没有数据)
     */
    export function Get<TName extends keyof CustomNetTableDeclarations, TKey extends keyof CustomNetTableDeclarations[TName]>(
        tableName: TName,
        key: TKey
    ): NetworkedData<CustomNetTableDeclarations[TName][TKey]> | null {
        // CustomNetTables.GetTableValue 在 Panorama 中返回的是具体的类型
        return CustomNetTables.GetTableValue(tableName, key);
    }

    /**
     * 获取当前本地玩家的数据
     */
    export function GetLocalPlayerStats(): NetworkedData<NetTableDef.PlayerData> | null {
        const localId = Players.GetLocalPlayer();
        return CustomNetTables.GetTableValue("player_data", String(localId));
    }

    /**
     * 监听网表变化 (强类型回调)
     */
    export function Listen<TName extends keyof CustomNetTableDeclarations>(
        tableName: TName,
        callback: (
            key: keyof CustomNetTableDeclarations[TName],
            value: NetworkedData<CustomNetTableDeclarations[TName][keyof CustomNetTableDeclarations[TName]]>
        ) => void
    ): NetTableListenerID {
        return CustomNetTables.SubscribeNetTableListener(tableName, (_tableName, key, value) => {
            // 这里将 value 强制转换为正确的类型传给回调
            callback(key, value);
        });
    }
}
