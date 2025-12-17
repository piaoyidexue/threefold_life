export interface HeroConfig {
    AggressionFactor: number; // 进攻欲望倍率 (1.0 = 标准, 1.5 = 疯狗)
    KeepRangeBuffer: number;  // 保持距离的缓冲 (远程英雄用)
    SearchRadius: number;     // 索敌范围
    RetreatHpThreshold: number; // 撤退血量阈值
}

export const AIConfig = {
    // 全局调试开关
    DEBUG_MODE: true,
    DEBUG_DRAW_DURATION: 0.15, // 绘制刷新时间

    // 默认配置
    Default: {
        AggressionFactor: 1.0,
        KeepRangeBuffer: 150,
        SearchRadius: 1200,
        RetreatHpThreshold: 0.25,
    } as HeroConfig,

    // 针对特定英雄的配置 (Key为单位名称)
    Heroes: {
        "npc_dota_hero_sven": {
            AggressionFactor: 1.5, // 斯温比较莽
            KeepRangeBuffer: 0,    // 近战不需要缓冲区
            SearchRadius: 1000,
            RetreatHpThreshold: 0.15, // 战死方休
        },
        "npc_dota_hero_crystal_maiden": {
            AggressionFactor: 0.6, // 冰女比较怂
            KeepRangeBuffer: 400,  // 站远点
            SearchRadius: 800,
            RetreatHpThreshold: 0.4, // 血量不健康就跑
        }
    } as Record<string, HeroConfig>,

    // 获取英雄配置的辅助函数
    get(unitName: string): HeroConfig {
        return this.Heroes[unitName] || this.Default;
    }
};
