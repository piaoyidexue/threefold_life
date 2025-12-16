import { RoleManager } from "../manager/RoleManager";

export function XPFilter(event: ModifyExperienceFilterEvent): boolean {
    const heroIndex = event.hero_entindex_const;
    const hero = EntIndexToHScript(heroIndex) as CDOTA_BaseNPC_Hero;

    if (!hero || !hero.IsRealHero()) return true;

    const amount = event.experience;

    // GDD逻辑: 如果是守护者获得经验，且内奸存活
    if (RoleManager.IsGuardian(hero) && RoleManager.IsTraitorAlive()) {
        const leechRatio = 0.20; // 20%
        const stolenAmount = amount * leechRatio;

        // 修改本次获得的经验值
        event.experience = amount - stolenAmount;

        // 将截流的经验存入后台池
        RoleManager.AddStolenXP(stolenAmount);
    }

    return true;
}
