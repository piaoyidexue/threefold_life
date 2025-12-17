import { IBotUnit } from "../core/IBotUnit";

export class DotaBotUnit implements IBotUnit {
    public unit: CDOTA_BaseNPC; // 公开以便 Adapter 内部访问

    constructor(unit: CDOTA_BaseNPC) {
        this.unit = unit;
    }

    isValid(): boolean { return this.unit && !this.unit.IsNull(); }
    getHandle(): number { return this.unit.entindex(); }
    getTeam(): number { return this.unit.GetTeamNumber(); }
    getPosition(): Vector { return this.unit.GetAbsOrigin(); }
    getHealthPercent(): number { return this.unit.GetHealthPercent() / 100; }
    getMana(): number { return this.unit.GetMana(); }
    getName(): string { return this.unit.GetUnitName(); }
    getAttackRange():number{
        return this.unit.Script_GetAttackRange();
    }

    getAttackAnimationPoint(): number {
        return this.unit.GetAttackAnimationPoint();
    }

    getSecondsPerAttack(): number {
        // 攻击间隔 = 基础攻击速度 / (攻速加成/100)
        // Dota API 直接给出了每秒攻击次数，取倒数即可，或者直接用 GetSecondsPerAttack
        return this.unit.GetSecondsPerAttack(false);
    }

    getLastAttackTime(): number {
        return this.unit.GetLastAttackTime();
    }

    isAlive(): boolean { return this.unit.IsAlive(); }
    isStunned(): boolean { return this.unit.IsStunned() || this.unit.IsHexed(); }
    isChanneling(): boolean { return this.unit.IsChanneling(); }

    isAttackReady(): boolean {
        // 检查攻击后摇和攻击间隔
        // Dota逻辑：LastAttackTime + AttackRate < GameTime
        // 这里的实现比较简化，实际可能需要读取攻击速度属性
        const lastAttack = this.unit.GetLastAttackTime();
        const attackRate = this.unit.GetAttackSpeed(false); // 这是一个百分比，需换算为秒
        // 简化版：假设基础间隔 1.7
        const cooldown = 1.7 / attackRate;
        return GameRules.GetGameTime() > lastAttack + cooldown;
    }

    getRangeTo(target: IBotUnit): number {
        return ((target.getPosition() - this.getPosition()) as Vector).Length2D();
    }

    getStunDurationRemaining(): number {
        const modifiers = this.unit.FindAllModifiers();
        let maxTime = 0;
        // 遍历所有 modifier 找 stun/hex 关键词
        for (const mod of modifiers) {
            const name = mod.GetName().toLowerCase();
            if (name.includes("stun") || name.includes("hex") || name.includes("shackles") || name.includes("sleep")) {
                const remaining = mod.GetRemainingTime();
                if (remaining > maxTime) maxTime = remaining;
            }
        }
        return maxTime;
    }

    getAbilityData(abilityName: string) {
        if (abilityName === "attack") {
            return {
                isReady: this.isAttackReady(), // 之前实现的
                range: this.unit.Script_GetAttackRange(),
                castPoint: this.unit.GetAttackAnimationPoint()
            };
        }
        const ability = this.unit.FindAbilityByName(abilityName);
        if (!ability) return null;

        // Dota 特定逻辑：IsFullyCastable 包含了 CD、蓝量、沉默状态检查
        return {
            isReady: ability.IsFullyCastable(),
            range: ability.GetCastRange(this.unit.GetAbsOrigin(), undefined),
            castPoint: ability.GetCastPoint()
        };
    }

    moveTo(position: Vector): boolean {
        ExecuteOrderFromTable({
            UnitIndex: this.unit.entindex(),
            OrderType: UnitOrder.MOVE_TO_POSITION,
            Position: position
        });
        return true;
    }

    attack(target: IBotUnit): boolean {
        ExecuteOrderFromTable({
            UnitIndex: this.unit.entindex(),
            OrderType: UnitOrder.ATTACK_TARGET,
            TargetIndex: target.getHandle() as  EntityIndex
        });
        return true;
    }

    stop(): boolean {
        this.unit.Stop();
        return true;
    }

    castTarget(abilityName: string, target: IBotUnit): boolean {
        const ability = this.unit.FindAbilityByName(abilityName);
        if (!ability) return false;
        ExecuteOrderFromTable({
            UnitIndex: this.unit.entindex(),
            OrderType: UnitOrder.CAST_TARGET,
            TargetIndex: target.getHandle() as  EntityIndex,
            AbilityIndex: ability.entindex()
        });
        return true;
    }

    castPoint(abilityName: string, position: Vector): boolean {
        // 实现略，同上，OrderType 为 DOTA_UNIT_ORDER_CAST_POSITION
        return true;
    }

    castNoTarget(abilityName: string): boolean {
        // 实现略
        return true;
    }
}
