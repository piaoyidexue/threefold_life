export enum TargetType {
    UNIT_TARGET, // 对着人放 (如斯温锤)
    POINT_TARGET, // 对着地点放 (如卡尔天火、火女T)
    NO_TARGET     // 原地放 (如拍拍熊开W)
}

export interface ComboResponse {
    responderName: string;   // 谁来响应 (英雄名)
    abilityName: string;     // 用什么技能响应
    targetType: TargetType;  // 施法类型
    delay: number;           // 延迟多久放 (秒，用于完美叠加控制)
    minScore: number;        // 响应的欲望基础分 (0.0 - 1.0)
}

// 连招数据库
export const ComboDatabase: Record<string, ComboResponse[]> = {
    // 触发器：潮汐毁灭
    "tidehunter_ravage": [
        {
            responderName: "npc_dota_hero_invoker",
            abilityName: "invoker_sun_strike",
            targetType: TargetType.POINT_TARGET,
            delay: 1.0, // 等人都飞起来再放天火
            minScore: 0.95
        },
        {
            responderName: "npc_dota_hero_lina",
            abilityName: "lina_light_strike_array", // 光击阵
            targetType: TargetType.POINT_TARGET,
            delay: 0.5,
            minScore: 0.9
        },
        {
            responderName: "npc_dota_hero_sven",
            abilityName: "sven_gods_strength", // 斯温开大
            targetType: TargetType.NO_TARGET,
            delay: 0.0, // 立即开大
            minScore: 0.8
        }
    ],
    // 触发器：谜团黑洞
    "enigma_black_hole": [
        {
            responderName: "npc_dota_hero_lich",
            abilityName: "lich_chain_frost", // 连环霜冻
            targetType: TargetType.UNIT_TARGET, // 随便丢给黑洞里的人
            delay: 0.2,
            minScore: 1.0 // 必放
        }
    ]
};
