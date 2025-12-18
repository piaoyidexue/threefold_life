
// 定义自定义事件的数据结构
export interface CustomEvents {
    // 游戏循环事件
    "rpg_day_start": { day: number };
    "rpg_night_start": { day: number };

    // 身份事件
    "rpg_role_assigned": { playerID: PlayerID; role: number };

    // 战斗事件
    "rpg_boss_spawned": { unit_index: EntityIndex };
    "rpg_base_damaged": { current_hp: number };
}

// 封装一个简单的事件发射器 (Event Bus)
export class EventBus {
    // 这里可以使用 dota 原生的 CustomGameEventManager 配合 backend-only events
    // 或者自己写一个简单的 Map<EventName, Callbacks[]>
    // 为了简单且支持 TS 类型检查，我们通常封装一层

    public static Emit<K extends keyof CustomEvents>(eventName: K, data: CustomEvents[K]) {
        // 在服务端触发一个自定义事件，各模块可以监听
        // 这里的实现可以借助 barebones 的实现，或者简单的 Observer 模式
        // 简单起见，利用 Dota 的 dynamic_event
        // (实际开发建议写一个纯 TS 的 Observer)
    }
    public static Subscribe<K extends keyof CustomEvents>(eventName: K, callback: (data: CustomEvents[K]) => void) {
        // 监听一个自定义事件，各模块可以发射
        // 这里的实现可以借助 barebones 的实现，或者简单的 Observer 模式
        // 简单起见，利用 Dota 的 dynamic_event
        // (实际开发建议写一个纯 TS 的 Observer)
    }
}
