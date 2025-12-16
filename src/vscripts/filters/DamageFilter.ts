import { RoleManager } from "../manager/RoleManager";

export function DamageFilter(event: DamageFilterEvent): boolean {
    const victimIndex = event.entindex_victim_const;
    const victim = EntIndexToHScript(victimIndex) as CDOTA_BaseNPC;

    // 简单的 Boss 判定：根据单位名称
    // 你需要在 npc_units_custom.txt 中定义名为 npc_boss_final 的单位
    const isBoss = victim.GetUnitName() === "npc_boss_final";

    if (isBoss) {
        // GDD逻辑: 暗影锁
        if (RoleManager.IsTraitorAlive()) {
            // 减伤 90%
            event.damage = event.damage * 0.1;

            // 视觉反馈：在 Boss 头顶弹出 "IMMUNE" 或类似提示
            // 这里用简单的 API 演示，实际建议用 SendOverheadEventMessage
            // print("[DamageFilter] Boss is protected by Shadow Lock!");
        }
    }

    return true;
}
