export const AI_CONSTANTS = {
    // 思考频率
    THINK_INTERVAL: 0.1,  // 10Hz

    // 战术参数
    FIGHT_POWER_RATIO: 1.2, // 战力比超过1.2才打
    RETREAT_HP_THRESHOLD: 0.3, // 血量低于30%考虑撤退

    // 权重配置
    WEIGHT_PROTECT_CARRY: 2.0,
    WEIGHT_KILL_LOW_HP: 1.5,

    // 配合参数
    CHAIN_STUN_OVERLAP_WINDOW: 0.5, // 允许晕眩重叠的时间窗（秒）
};

export enum TeamState {
    IDLE = 0,
    FARM = 1,
    GROUP_UP = 2,
    FIGHT = 3,
    RETREAT = 4
}
