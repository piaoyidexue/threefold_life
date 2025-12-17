// 在某个 TS 文件中 (例如 classes/TraitorAbility.ts)
export function OnTraitorTransform(keys: any) {
    const caster = keys.caster as CDOTA_BaseNPC_Hero;

    // 1. 变身模型
    caster.SetOriginalModel("models/heroes/shadow_fiend/shadow_fiend.vmdl");
    caster.SetModel("models/heroes/shadow_fiend/shadow_fiend.vmdl");

    // 2. 增加血量上限 (翻倍)
    const baseStr = caster.GetBaseStrength();
    caster.SetBaseStrength(baseStr * 2);
    caster.Heal(caster.GetMaxHealth(), caster);

    // 3. 移除无敌/和平锁定 (如果有)
    caster.RemoveModifierByName("modifier_invulnerable");

    // 4. 替换技能组
    // 这里比较繁琐，通常是 SwapAbilities，或者直接添加新技能
    // caster.AddAbility("traitor_raze_1"); ...

    // 5. 播放特效和音效
    const particle = ParticleManager.CreateParticle("particles/units/heroes/hero_shadow_fiend/shadow_fiend_presence.vpcf", ParticleAttachment.ABSORIGIN_FOLLOW, caster);
    EmitSoundOn("Hero_ShadowFiend.RequiemOfSouls", caster);
}

// 记得在 addon_game_mode.ts 里的 Activate 把这个函数暴露给 Lua
// (getfenv() as any).OnTraitorTransform = OnTraitorTransform;
