import { BaseAbility, registerAbility } from "../lib/dota_ts_adapter";

@registerAbility()
export class traitor_transform extends BaseAbility {
    OnSpellStart() {
        const caster = this.GetCaster();
        const playerID = caster.GetPlayerOwnerID();

        // 播放特效
        const particle = ParticleManager.CreateParticle("particles/units/heroes/hero_nevermore/nevermore_requiem_of_souls.vpcf", ParticleAttachment.ABSORIGIN_FOLLOW, caster);

        // 1. 改变模型
        caster.SetOriginalModel("models/heroes/shadow_fiend/shadow_fiend.vmdl");
        caster.SetModel("models/heroes/shadow_fiend/shadow_fiend.vmdl");

        // 2. 改变阵营
        caster.SetTeam(DotaTeam.BADGUYS);

        // 3. 替换技能 (需要预先知道技能名称)
        const oldAbilities = ["ability_traitor_1", "ability_traitor_2"];
        const newAbilities = ["nevermore_shadowraze1", "nevermore_requiem"];

        // 移除旧技能
        // 添加新技能... 此处代码略，需要遍历Slot交换

        // 4. 发送全局通告
        GameRules.SendCustomMessage(`<font color='#FF0000'>警报！玩家 ${PlayerResource.GetPlayerName(playerID)} 显露了真身，他是暗影潜行者！</font>`, 0, 0);
    }
}
