export async function rollAllDices(bodyValue) {
    const actionRoll = await new Roll("1d20").roll();
    if (actionRoll.total <= bodyValue) {
        const dammageRoll = await new Roll("1d6").roll();
        const dammages = dammageRoll.total <= 4 ? 3 : actionRoll.total;
        return actionRoll.total, dammages;
    }
    return actionRoll.total, 0;
}

export async function rollDammagesDice(intialRoll,actor,isTwoWeaponsAttack) {
    const baseDammage = actor.system.attributes.Avantage == "Fort" ? 4 :3;
    let dammageRoll;
    if(actor.system.attributes.Avantage == "Ambidextre" && isTwoWeaponsAttack){
        dammageRoll = new Roll("2d6kh");
    }else{
        dammageRoll = new Roll("1d6");
    }

    let dammageRollTotal = await dammageRoll.roll();
    if(actor.system.attributes.Avantage == "Ambidextre" && isTwoWeaponsAttack){
    dammageRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        flavor: `<div class="sombre-header">Attaque ambidextre</div>
                <div class="sombre-desc">${actor.name} attaque avec ses deux armes et produit des dégâts ${dammageRollTotal.total <= 4 ? "fixes":"variables"}</div>`
       })
    }

    const dammages = actor.system.attributes.Desavantage == "Chétif" ? baseDammage : dammageRollTotal.total <= 4 ? baseDammage : intialRoll;
    return dammages;
}

export async function rollDammagesDiceMonster(intialRoll,actor){
    let dammageRoll = await new Roll("1d6").roll();
    let maxDammages = dammageRoll.total > 4; 
    if(actor.system.attributes.Danger == 1){
        return maxDammages ? actor.system.attributes.MaxDammages : 2;
    }else{
        return  maxDammages ? intialRoll : 3;
    }
}
export function getRollMessage(isBodyRoll, actor, rollStatus, total, dammages, doDamage, adrenalineUsed) {
  if (isBodyRoll) {
    let attackMessage = doDamage ? 'Attaque' : 'Test de Corps';
    let adrenalineMessage = adrenalineUsed ? 'puise dans ses dernières forces pour entreprendre une' : 'entreprend une'
    if(rollStatus){
        return `<div class="sombre-msg success">
                 <div class="sombre-header">${attackMessage}</div>
                <div class="sombre-result">✔ Réussite ${total}/${actor.system.attributes.Corps}</div>
                <div class="sombre-desc">${doDamage? "Le coup atteint sa cible et cause "+ dammages + " blessures":actor.name + "réussie son action"}</div>
                </div>`
    }else{
        return `<div class="sombre-msg fail">
                 <div class="sombre-header">${attackMessage}</div>
                <div class="sombre-result">✖ Échec ${total}/${actor.system.attributes.Corps}</div>
                <div class="sombre-desc">${doDamage? "Le coup rate sa cible...": actor.name + "rate son action..."}</div>
                </div>`
    }
  } else {
     if(rollStatus && actor.system.attributes.Desavantage != "Chagrin"){
        return `<div class="sombre-msg success">
                 <div class="sombre-header">Test d'Esprit</div>
                <div class="sombre-result">✔ Réussite ${total}/${actor.system.attributes.Esprit}</div>
                <div class="sombre-desc">${actor.name} réussi à garder son calme</div>
                </div>`
    }else{
        return `<div class="sombre-msg fail">
                 <div class="sombre-header">Test d'Esprit</div>
                <div class="sombre-result">✖ Échec ${total}/${actor.system.attributes.Esprit}</div>
                <div class="sombre-desc">${actor.name} ${ actor.system.attributes.Desavantage == "Chagrin" ? "se laisse emporter par sa tristesse" : "ne parviens pas à se ressaisir"}</div>
                </div>`
    }
  }

}
