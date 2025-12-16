import { GAME_SETTINGS } from "../settings";

export class RadianceSystem {
    private static currentValue: number = GAME_SETTINGS.BASE_RADIANCE; // 默认为 100

    public static Init() {
        // 初始化时同步一次给所有客户端
        this.UpdateNetTable();
    }

    public static ModifyRadiance(amount: number) {
        this.currentValue += amount;

        // 钳制在 0 - 100 之间
        if (this.currentValue > 100) this.currentValue = 100;
        if (this.currentValue < 0) this.currentValue = 0;

        this.UpdateNetTable();
        this.CheckThresholds();
    }

    public static GetRadiance(): number {
        return this.currentValue;
    }

    private static UpdateNetTable() {
        // 将数据发送到前端，供 Panorama UI 读取
        CustomNetTables.SetTableValue("game_state", "radiance", {
            value: this.currentValue
        });
    }

    private static CheckThresholds() {
        // GDD: 阈值效果
        if (this.currentValue <= 25) {
            // 黯淡：视野降低
            // 实际上这个要在 OnThink 里不断设置视野，或者给所有玩家上 Modifier
            // 简单做法：发送事件通知 GameLoop 或直接在这里处理
        }
    }

    // 供 GameLoop 每秒调用的自然衰减
    public static OnThink(isDay: boolean) {
        const decay = isDay ? 0.2 : 0.5;
        // 注意：因为 OnThink 可能是 1秒一次，如果是 0.1秒一次则需要除以10
        this.ModifyRadiance(-decay);
    }
}
