/**
 * 跨引擎单位接口
 * 在 Unity 中，你会实现一个 UnityBotUnit 来替换掉 DotaBotUnit
 */
export interface IBotUnit {
    isValid(): boolean;
    getHandle(): number; // 唯一ID
    getTeam(): number;
    getPosition(): Vector;
    getHealthPercent(): number;
    getMana(): number;
    getName(): string;
    getAttackRange():number;

    getAttackAnimationPoint(): number; // 获取攻击前摇时间 (秒)
    getSecondsPerAttack(): number;     // 获取攻击间隔 (秒)
    getLastAttackTime(): number;       // 获取上次攻击的时间戳
    // 状态查询
    isAlive(): boolean;
    isStunned(): boolean;
    isChanneling(): boolean;
    isAttackReady(): boolean;

    // 复杂查询
    getStunDurationRemaining(): number; // 剩余晕眩时间
    getRangeTo(target: IBotUnit): number;

    // 动作指令 (返回是否成功发出指令)
    moveTo(position: Vector): boolean;
    attack(target: IBotUnit): boolean;
    stop(): boolean;

    // 技能系统抽象
    getAbilityData(abilityName: string): {
        isReady: boolean,
        range: number,
        castPoint: number,
        damageType?: number
    } | null;

    castTarget(abilityName: string, target: IBotUnit): boolean;
    castPoint(abilityName: string, position: Vector): boolean;
    castNoTarget(abilityName: string): boolean;
}
