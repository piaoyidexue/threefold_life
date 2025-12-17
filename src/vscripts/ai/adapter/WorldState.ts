import {IBotUnit} from "../core/IBotUnit";
import {DotaBotUnit} from "./DotaBotUnit";

export class WorldState {
    /**
     * 获取指定范围内的可见敌人
     */
    public static GetVisibleEnemies(center: IBotUnit, radius: number): IBotUnit[] {
        const dotaUnit = (center as DotaBotUnit).unit;
        const enemies = FindUnitsInRadius(
            dotaUnit.GetTeamNumber(),
            dotaUnit.GetAbsOrigin(),
            undefined,
            radius,
            UnitTargetTeam.ENEMY,
            UnitTargetType.HERO,
            UnitTargetFlags.NO_INVIS,
            FindOrder.CLOSEST,
            false
        );
        return enemies.map(e => new DotaBotUnit(e));
    }

    public static GetAllies(center: IBotUnit, radius: number): IBotUnit[] {
        const dotaUnit = (center as DotaBotUnit).unit;
        const allies = FindUnitsInRadius(
            dotaUnit.GetTeamNumber(),
            dotaUnit.GetAbsOrigin(),
            undefined,
            radius,
            UnitTargetTeam.FRIENDLY,
            UnitTargetType.HERO,
            UnitTargetFlags.NONE,
            FindOrder.ANY,
            false
        );
        return allies.map(e => new DotaBotUnit(e));
    }

    /**
     * 获取血量最低的敌人（收割逻辑）
     */
    public static getWeakestEnemy(observer: IBotUnit, radius: number): IBotUnit | null {
        const enemies = this.GetVisibleEnemies(observer, radius);
        let weakest: IBotUnit | null = null;
        let minHpPct = 1.0;

        for (const enemy of enemies) {
            const hp = enemy.getHealthPercent();
            if (hp < minHpPct) {
                minHpPct = hp;
                weakest = enemy;
            }
        }
        return weakest;
    }
    /**
     * [高级] 寻找最佳的AOE释放中心点
     * @param observer 施法者
     * @param radius 搜索范围
     * @param aoeRadius 技能的AOE半径
     * @param minUnitCount 最少打中几个人才放
     */
    public static findBestAOELocation(
        observer: IBotUnit,
        radius: number,
        aoeRadius: number,
        minUnitCount: number = 2
    ): Vector | null {
        const enemies = this.GetVisibleEnemies(observer, radius);
        if (enemies.length < minUnitCount) return null;

        // 简易算法：计算所有敌人的重心，如果重心周围有足够多的人，就打重心
        // 商业级算法通常会使用“K-Means聚类”或“扫描线算法”，这里使用重心法作为近似
        let centerSum = Vector(0, 0, 0);
        let count = 0;

        // 只计算英雄
        const heroes = enemies.filter(e => (e as DotaBotUnit).unit.IsHero());
        if (heroes.length === 0) return null;

        for (const hero of heroes) {
            centerSum = (centerSum + hero.getPosition()) as Vector;
            count++;
        }

        const centerOfMass = (centerSum / count) as Vector;

        // 验证重心周围有多少人
        let unitsHit = 0;
        for (const hero of heroes) {
            const dist = ((hero.getPosition() - centerOfMass) as Vector).Length2D();
            if (dist <= aoeRadius) {
                unitsHit++;
            }
        }

        if (unitsHit >= minUnitCount) {
            return centerOfMass;
        }

        return null;
    }
    /**
     * [新增] 寻找最需要救援的队友
     * @param observer 施法者
     * @param range 施法距离
     * @returns { unit: IBotUnit, urgency: number } urgency 越高越危急
     */
    public static getAllyInDanger(observer: IBotUnit, range: number): IBotUnit | null {
        const allies = this.GetAllies(observer, range);
        let target: IBotUnit | null = null;
        let maxUrgency = -1;

        for (const ally of allies) {
            // 不救自己（自保逻辑由 Action_Retreat 处理），也不救满血的
            if (ally.getHandle() === observer.getHandle()) continue;

            const hpPct = ally.getHealthPercent();
            if (hpPct > 0.4) continue; // 血量健康，略过

            // 计算危机程度
            // 基础分：血越少分越高
            let urgency = (1.0 - hpPct) * 100;

            // 如果被晕住了，危机感加倍
            if (ally.isStunned()) urgency += 50;

            // 简单的“周围有多少敌人”检测 (需要 Adapter 提供 getNearbyEnemies)
            // 这里简化逻辑：血量极低(20%)时优先级极高
            if (hpPct < 0.2) urgency += 50;

            if (urgency > maxUrgency) {
                maxUrgency = urgency;
                target = ally;
            }
        }

        return target;
    }
}
