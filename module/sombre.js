import * as Dice from "../module/dice.js";
import * as cpLoader from "../module/compendiumLoader.js";

let TRAITS_CACHE = null;
let PERS_CACHE = null;

class SombreActorSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: `systems/sombre-classic/templates/sheets/sombre-character-sheet.hbs`,
      tabs: [
        {
          navSelector: ".tabs",
          contentSelector: ".sheet-body",
          initial: "stats"
        }
      ]
    });
  }

  getData() {
    const context = super.getData();
    context.system = this.actor.system; // Les données issues du DataModel

    const traits = TRAITS_CACHE;

    const personnality = PERS_CACHE;

    const current = context.system.attributes.Personnality;

    const second = context.system.attributes.SecondPersonnality;


    const firstFound = personnality.find(t => t.Name === current);
    const secondFound = personnality.find(t => t.Name === second);

    const hasCustomPersonnality = this.actor.system.attributes.customPersonnality.stage1.length > 0;
    context.personnalityDesc = firstFound != null ? getPersonnalitieDesc(this.actor.system.attributes.Personnality, this.actor.system.attributes.Esprit, hasCustomPersonnality, this.actor.system.attributes.customPersonnality,this.actor) : "";
    context.secondPersonnalityDesc = secondFound != null ? getPersonnalitieDesc(this.actor.system.attributes.Personnality, this.actor.system.attributes.Esprit, hasCustomPersonnality, this.actor.system.attributes.customPersonnality,this.actor) : "";

    const corps = this.actor.system.attributes.Corps;
    let max = this.getAdrenalineMax()

    const used = this.actor.system.resources.adrenalineUsed;

    const available = max - used;

    context.adrenaline1 = max >= 1
      ? (available > 0 ? "available" : "used")
      : "locked";

    context.adrenaline2 = max >= 2
      ? (available > 1 ? "available" : "used")
      : "locked";

    context.adrenaline3 = max >= 3
      ? (available > 2 ? "available" : "used")
      : "locked";

    const actualadvantage = this.actor.system.attributes.Avantage;
    context.positivesTraitsNames = TRAITS_CACHE.filter(t => t.Category == "Avantage").map((trait, index, array) => {
      return {
        trait,
        selected: trait.Name === actualadvantage
      }
    });

    const actualdisadvantage = this.actor.system.attributes.Desavantage;
    context.negativesTraitsNames = TRAITS_CACHE.filter(t => t.Category == "Désavantage").map((trait, index, array) => {
      return {
        trait,
        selected: trait.Name === actualdisadvantage
      }
    });

    const actualPersonnality = (hasCustomPersonnality && this.actor.system.attributes.Personnality == "Custom") ? this.actor.system.attributes.customPersonnality : this.actor.system.attributes.Personnality;
    context.personnalitiesNames = getPersonnalitiesNames(hasCustomPersonnality).map((name, index, array) => {
      return {
        name,
        selected: this.object.system.Personnality === actualPersonnality
      }
    });

    const actualSecondPersonnality = this.actor.system.attributes.SecondPersonnality;
    context.secondPersonnalitiesNames = getPersonnalitiesNames(hasCustomPersonnality).map((name, index, array) => {
      return {
        name,
        selected: this.object.system.SecondPersonnality === actualSecondPersonnality
      }
    });
    return context;
  }

  getAdrenalineMax() {
    const corps = this.actor.system.attributes.Corps;

    if (corps >= 12) return 1;
    if (corps <= 8 && corps > 4) return 2;
    if (this.actor.system.attributes.Desavantage == "Trauma") {
      return 2;
    }
    return 3;
  }

  activateListeners(html) {
    super.activateListeners(html);


    html.find(".rollButton").click(async (e) => {
      const isBodyRoll = e.target.classList.contains('roll-corps');
      let statToCheck = isBodyRoll ? this.actor.system.attributes.Corps : this.actor.system.attributes.Esprit;
      const roll = new Roll(`1d20`);
      let doDamage = false;
      let useAdrenaline = false;
      let isLucky = false;
      let isTwoWeaponsAttack = false;
      const canUseAdrenaline = isBodyRoll || this.actor.system.attributes.Avantage == 'Lucidité';



      if (isBodyRoll) {
        doDamage = await new Promise(resolve => {
          if (this.actor.system.attributes.Desavantage == "Vieux" && this.actor.system.resources.adrenalineUsed >= this.getAdrenalineMax()) {

            return resolve(false);
          }
          new Dialog({
            title: "Jet de Corps",
            content: "<p>Est-ce une attaque ?</p>",
            buttons: {
              yes: {
                label: "Oui (avec dégâts)",
                callback: () => resolve(true)
              },
              no: {
                label: "Non",
                callback: () => resolve(false)
              }
            },
            default: "no",
            close: () => resolve(false) // sécurité si fermeture
          }).render(true);
        });

      }
      if (canUseAdrenaline) {
        useAdrenaline = await new Promise(resolve => {
          if (this.actor.system.resources.adrenalineUsed >= this.getAdrenalineMax()) {
            return resolve(false); // plus de points
          }
          if (this.actor.system.attributes.Desavantage == "Vieux" && doDamage) {
            return resolve(true);
          }

          new Dialog({
            title: "Adrénaline",
            content: "<p>Utiliser un point pour agir à plein potentiel ?</p>",
            buttons: {
              yes: { label: "Oui", callback: () => resolve(true) },
              no: { label: "Non", callback: () => resolve(false) }
            },
            default: "no",
            close: () => resolve(false)
          }).render(true);
        });
      }
      if (this.actor.system.attributes.Avantage == "Porte-bonheur") {
        isLucky = await new Promise(resolve => {
          new Dialog({
            title: "Porte-bonheur",
            content: "<p>Etes vous proche de votre porte-bonheur ?</p>",
            buttons: {
              yes: { label: "Oui", callback: () => resolve(true) },
              no: { label: "Non", callback: () => resolve(false) }
            },
            default: "no",
            close: () => resolve(false)
          }).render(true);
        });
      }
      if (this.actor.system.attributes.Avantage == "Ambidextre" && doDamage) {
        isTwoWeaponsAttack = await new Promise(resolve => {
          new Dialog({
            title: "Ambidextrie",
            content: "<p>Avez vous une arme dans chaque main ?</p>",
            buttons: {
              yes: { label: "Oui", callback: () => resolve(true) },
              no: { label: "Non", callback: () => resolve(false) }
            },
            default: "no",
            close: () => resolve(false)
          }).render(true);
        });
      }
      roll.roll().then(async r => {
        if (useAdrenaline) {
          if (this.actor.system.attributes.Desavantage == "Vieux") {
            await ChatMessage.create({
              speaker: ChatMessage.getSpeaker({ actor: this.actor }),
              content: `<p>${this.actor.name} doit puiser dans des forces insoupçonnées pour se battre</p>`
            })
          }
          statToCheck = this.actor.system.attributes.AdrenalineValue;
          await this.actor.update({
            "system.resources.adrenalineUsed":
              this.actor.system.resources.adrenalineUsed + 1
          });
          if (this.actor.system.attributes.Desavantage == "Panique") {
            await this.actor.update({
              "system.attributes.Esprit": this.actor.system.attributes.Esprit - 1
            })
          }
        }
        let rollTotal = r.total;
        let rollStatus = isLucky ? (rollTotal <= statToCheck || rollTotal == 13) : rollTotal <= statToCheck;
        if (isLucky && rollTotal == 13) {
          await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            content: `<p>${this.actor.name} réussi grâce à la proximité de son porte bonheur</p>`
          })
        }
        if (!rollStatus) {
          let adrenalineWin = rollTotal <= this.actor.system.attributes.AdrenalineValue;
          if (canUseAdrenaline && this.actor.system.attributes.Avantage == "Vétéran" && !useAdrenaline && adrenalineWin) {
            useAdrenaline = await new Promise(resolve => {
              if (this.actor.system.resources.adrenalineUsed >= this.getAdrenalineMax() || this.actor.system.resources.veteran == 0) {
                return resolve(false); // plus de points
              }
              new Dialog({
                title: "Vétéran",
                content: `<p>Vous avez raté votre jet (${rollTotal}), utiliser un point pour agir à plein potentiel ?</p>`,
                buttons: {
                  yes: { label: "Oui", callback: () => resolve(true) },
                  no: { label: "Non", callback: () => resolve(false) }
                },
                default: "no",
                close: () => resolve(false)
              }).render(true);
            });

            if (useAdrenaline) {
              await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                content: `<p>${this.actor.name} puise dans son expérience de vétéran pour réussir</p>`
              })
              rollStatus = true;
              await this.actor.update({
                "system.resources.veteran": 0,
                "system.resources.adrenalineUsed":
                  this.actor.system.resources.adrenalineUsed + 1
              })
            }
          }
          if (this.actor.system.attributes.Avantage == "In extremis") {
            if (this.actor.system.resources.inExtremis > 0) {
              let useInExtremis = await new Promise(resolve => {
                new Dialog({
                  title: "In extremis",
                  content: "<p>Votre jet a échoué, voulez vous utiliser votre chance insolante ?</p>",
                  buttons: {
                    yes: { label: "Oui", callback: () => resolve(true) },
                    no: { label: "Non", callback: () => resolve(false) }
                  },
                  default: "no",
                  close: () => resolve(false)
                }).render(true);
              });
              if (useInExtremis) {
                rollStatus = true;
                rollTotal = 1;
                await this.actor.update({
                  "system.resources.inExtremis": 0
                })
              }
            }
          }
        }
        if (!isBodyRoll && this.actor.system.attributes.Desavantage == "Chagrin") {
          rollStatus = false;
        }
        let dammages = 0;
        if (rollStatus && doDamage) {
          dammages = await Dice.rollDammagesDice(rollTotal, this.actor, isTwoWeaponsAttack);
        }
        r.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          content: Dice.getRollMessage(isBodyRoll, this.actor, rollStatus, rollTotal, dammages, doDamage, useAdrenaline)
        })
      });
    });

    html.find(".resources-reset").click(async (e) => {
      let pointsToGetBack = await new Promise(resolve => {
        new Dialog({
          title: "Récupérer de l'adrénaline",
          content: "<p>Combien de points souhaitez vous récupérer?</p>",
          buttons: {
            1: { label: "1", callback: () => resolve(1) },
            2: { label: "2", callback: () => resolve(2) },
            3: { label: "3", callback: () => resolve(3) },
          },
          default: 0,
          close: () => resolve(0)
        }).render(true);
      });
      if (this.actor.system.attributes.Avantage == "In extremis") {
        let resetInExtremis = await new Promise(resolve => {
          new Dialog({
            title: "In extremis",
            content: "<p>Souhaitez vous récupérer votre chance insolante?</p>",
            buttons: {
              yes: { label: "Oui", callback: () => resolve(true) },
              no: { label: "Non", callback: () => resolve(false) }
            },
            default: "no",
            close: () => resolve(false)
          }).render(true);
        });

        if (resetInExtremis) {
          await this.actor.update({
            "system.resources.inExtremis": 1
          })
        }
      }
      if (this.actor.system.attributes.Avantage == "Vétéran") {
        let resetVeteran = await new Promise(resolve => {
          new Dialog({
            title: "Vétéran",
            content: "<p>Souhaitez vous récupérer votre expertise?</p>",
            buttons: {
              yes: { label: "Oui", callback: () => resolve(true) },
              no: { label: "Non", callback: () => resolve(false) }
            },
            default: "no",
            close: () => resolve(false)
          }).render(true);
        });

        if (resetVeteran) {
          await this.actor.update({
            "system.resources.veteran": 1
          })
        }
      }



      if (this.actor.system.resources.adrenalineUsed - pointsToGetBack < 0) {
        pointsToGetBack = this.actor.system.resources.adrenalineUsed;
      }
      await this.actor.update({
        "system.resources.adrenalineUsed":
          this.actor.system.resources.adrenalineUsed - pointsToGetBack
      });
    })


    html.find(".dot").click(async (e) => {
      if (this.actor.system.resources.adrenalineUsed < this.getAdrenalineMax() && this.actor.system.attributes.Avantage == "Dernier souffle") {
        await this.actor.update({
          "system.resources.adrenalineUsed": this.actor.system.resources.adrenalineUsed + 1
        })
      }

    })

    html.find('.heart-bolt').click(async (e) => {
      let spiritPhase = this.actor.system.attributes.Esprit > 8 ? 1 : this.actor.system.attributes.Esprit > 4 ? 2 : 3;
      const roll = await new Roll(`${spiritPhase}d6`).roll();

      let leftHealth = this.actor.system.attributes.Corps - roll.total;
      if (this.actor.system.attributes.Avantage == "Dernier souffle" && leftHealth <= 0) {
        let leftAdre = 3 - this.actor.system.resources.adrenalineUsed;
        if (leftHealth + leftAdre > 0) {
          let usedAdre = roll.total - this.actor.system.attributes.Corps + 1;
          leftHealth = 1;
          await this.actor.update({
            "system.resources.adrenalineUsed": this.actor.system.resources.adrenalineUsed + usedAdre
          })
        }
      }
      await this.actor.update({
        "system.attributes.Corps": leftHealth <= 0 ? 0 : leftHealth
      });
      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `
        <div class="sombre-msg critical">
        <div class="sombre-header critical"><span class="icon heart-icon"><i class="fas fa-heartbeat"></i></span>CRISE CARDIAQUE</div>
        <div class="sombre-result">💀 ${roll.total} dégâts</div>
        <div class="sombre-desc">${leftHealth <= 0 ? '<em>Alors que ton coeur flanche... tu rends son dernier souffle...<em>' : '<b>Tu y survis de justesse</b>'}</div>
        </div>
        `
      });
    })

    html.find('[name="system.attributes.Desavantage"]').change(async (e) => {
      if (e.currentTarget.selectedOptions[0].label == "Maladroit") {
        let adreMaxValue = await new Promise(resolve => {
          new Dialog({
            title: "Valeur adrénaline",
            content: "<p>A combien le seuil maximum doit être défini?</p>",
            buttons: {
              9: { label: "9", callback: () => resolve(9) },
              10: { label: "10", callback: () => resolve(10) },
              11: { label: "11", callback: () => resolve(11) },
            },
            default: 12,
            close: () => resolve(12)
          }).render(true);
        });
        this.actor.update({
          "system.attributes.AdrenalineValue": adreMaxValue
        });
      }
      if (this.actor.system.attributes.AdrenalineValue != 12) {
        this.actor.update({
          "system.attributes.AdrenalineValue": 12
        });
      }

    })
    html.find('[name="system.attributes.Avantage"]').change(async (e) => {
      let stage1 = "";
      let stage2 = "";
      let stage3 = "";
      if (e.currentTarget.selectedOptions[0].label == "Atypique") {
        const first = getFirstStagePersonnalityNames();
        const second = getSecondStagePersonnalityNames();
        const third = getThridStagePersonnalityNames();

        const content = `
<form>
  <div class="form-group">
    <label>Équilibré</label>
    <select name="stage1">
      ${buildOptions(first)}
    </select>
  </div>

  <div class="form-group">
    <label>Perturbé</label>
    <select name="stage2">
      ${buildOptions(second)}
    </select>
  </div>

  <div class="form-group">
    <label>Désaxé</label>
    <select name="stage3">
      ${buildOptions(third)}
    </select>
  </div>
</form>
`;
        await new Promise(resolve => {
          new Dialog({
            title: "Composez votre personnalité",
            content,
            buttons: {
              confirm: {
                label: "Valider",
                callback: (html) => {
                  stage1 = html.find('[name="stage1"]').val();
                  stage2 = html.find('[name="stage2"]').val();
                  stage3 = html.find('[name="stage3"]').val();
                  resolve({ stage1, stage2, stage3 });
                }
              },
              cancel: {
                label: "Annuler"
              }
            },
            default: "confirm"
          }).render(true)
        }).then(async r => {
          console.log(stage1, stage2, stage3)
          await this.actor.update({
            "system.attributes.customPersonnality": {
              stage1,
              stage2,
              stage3
            }
          });
        })
      }
    })

    html.find('[name="system.inventory"]').on("change", async (event) => {
      await this.actor.update({
        "system.resources.inventory": event.target.value
      });
    });
  }
}



class SombreAntagonistSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["sombre", "antagonist-sheet"],
      template: "systems/sombre-classic/templates/sheets/sombre-bbeg-sheet.hbs"
    });
  }

  get template() {
    return "systems/sombre-classic/templates/sheets/sombre-bbeg-sheet.hbs";
  }

  getData() {
    const context = super.getData();
    context.system = this.actor.system; // Les données issues du DataModel

    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);


    html.find('[name="system.attributes.Danger"]').change(async (event) => {
      let maximumDammages;
      if (event.target.value == 1) {
        await new Promise(resolve => {
          new Dialog({
            title: "Définir le laquet",
            content: `
<form class="dialog-form">
 <div class="form-group">
    <label>Dégats maximum du laquet (par défaut 3)</label>
    <input type="number" name="value" min="0" step="1" />
  </div></form>
  `     ,
            buttons: {
              confirm: {
                label: "Valider",
                callback: (html) => {
                  maximumDammages = Number(html.find('[name="value"]').val())
                  if (maximumDammages == 0 || maximumDammages == undefined) {
                    maximumDammages = 3;
                  }
                  resolve({ maximumDammages });
                }
              },
              cancel: {
                label: "Annuler"
              }
            },
            default: 3,
            close: () => resolve(3)
          }).render(true)
        }).then(async r => {

          await this.actor.update({
            "system.attributes.MaxDammages": maximumDammages
          });
        })
      }

    })

    html.find(".rollButton").click(async (e) => {
      const isBodyRoll = e.target.classList.contains('roll-corps');
      let statToCheck = this.actor.system.attributes.Danger == 1 ? isBodyRoll ? this.actor.system.attributes.Corps : this.actor.system.attributes.Esprit : 12;
      const roll = new Roll(`1d20`);
      let doDamage = false;

      if (isBodyRoll) {
        doDamage = await new Promise(resolve => {
          new Dialog({
            title: "Jet de Corps",
            content: "<p>Est-ce une attaque ?</p>",
            buttons: {
              yes: {
                label: "Oui (avec dégâts)",
                callback: () => resolve(true)
              },
              no: {
                label: "Non",
                callback: () => resolve(false)
              }
            },
            default: "no",
            close: () => resolve(false) // sécurité si fermeture
          }).render(true);
        });

      }

      roll.roll().then(async r => {
        let rollTotal = r.total;
        let rollStatus = rollTotal <= statToCheck;

        let dammages = 0;
        if (rollStatus && doDamage) {
          dammages = await Dice.rollDammagesDiceMonster(rollTotal, this.actor);
        }
        r.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          content: Dice.getRollMessage(isBodyRoll, this.actor, rollStatus, rollTotal, dammages, doDamage, false)
        })
      });
    });
  }
}


Hooks.once("ready", async () => {
  await loadTraits();
  await loadPersonnalities();
})

class Trait extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      Name: new foundry.data.fields.StringField(),
      Description: new foundry.data.fields.StringField(),
      Category: new foundry.data.fields.StringField(),
      Type: new foundry.data.fields.StringField()
    };
  }
}

class Personnality extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      Name: new foundry.data.fields.StringField(),
      Equilibre: new foundry.data.fields.StringField(),
      Perturbe: new foundry.data.fields.StringField(),
      Desaxe: new foundry.data.fields.StringField()
    };
  }
}

Hooks.once("init", () => {
  console.log("Sombre: les ténèbres s'initialisent...")

  CONFIG.Item.dataModels = {
    trait: Trait,
    personnality: Personnality
  };

  CONFIG.Actor.dataModels = {
    character: class CharacterData extends foundry.abstract.DataModel {
      static defineSchema() {
        return {
          attributes: new foundry.data.fields.SchemaField({
            Corps: new foundry.data.fields.NumberField({ initial: 12 }),
            Esprit: new foundry.data.fields.NumberField({ initial: 12 }),
            Avantage: new foundry.data.fields.StringField({
              initial: "Fort"
            }),
            Desavantage: new foundry.data.fields.StringField({
              initial: "Ecervelé"
            }),
            Personnality: new foundry.data.fields.StringField({
              initial: "Timide"
            }),
            SecondPersonnality: new foundry.data.fields.StringField({
              initial: "Timide"
            }),
            AdrenalineValue: new foundry.data.fields.NumberField({ initial: 12 }),
            customPersonnality: new foundry.data.fields.SchemaField({
              stage1: new foundry.data.fields.StringField({ initial: "" }),
              stage2: new foundry.data.fields.StringField({ initial: "" }),
              stage3: new foundry.data.fields.StringField({ initial: "" })
            }),
            biography: new foundry.data.fields.StringField({ initial: "" })
          }),
          resources: new foundry.data.fields.SchemaField({
            adrenalineUsed: new foundry.data.fields.NumberField({ initial: 0 }),
            inExtremis: new foundry.data.fields.NumberField({ initial: 1 }),
            veteran: new foundry.data.fields.NumberField({ initial: 1 }),
            inventory: new foundry.data.fields.StringField({ initial: "" })
          })
        }
      };

    },
    antagonist: class SombreAntagonist extends foundry.abstract.DataModel {
      static defineSchema() {
        return {
          attributes: new foundry.data.fields.SchemaField({
            Corps: new foundry.data.fields.NumberField({ initial: 14 }),
            Esprit: new foundry.data.fields.NumberField({ initial: 14 }),
            Danger: new foundry.data.fields.NumberField({ initial: 2 }),
            MaxDammages: new foundry.data.fields.NumberField({ initial: 3 })
          })
        }
      };
    }
  }

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("sombre", SombreAntagonistSheet, {
    types: ["antagonist"],
    makeDefault: false
  });
  Actors.registerSheet("sombre", SombreActorSheet, {
    types: ["character"],
    makeDefault: true
  });
});



function getFirstStagePersonnalityNames() {
  let names = [];
  for (var personnalitieName in PERS_CACHE) {
    names.push([personnalitieName.Name, personnalitieName.Stages.Equilibre]);
  }
  return names;
}

function getSecondStagePersonnalityNames() {
  let names = [];
  for (var personnalitieName in PERS_CACHE) {
    names.push([personnalitieName.Name, personnalitieName.Stages.Perturbe]);
  }
  return names;
}

function getThridStagePersonnalityNames() {
  let names = [];
  for (var personnalitieName in PERS_CACHE) {
    names.push([personnalitieName.Name, personnalitieName.Stages.Desaxe]);
  }
  return names;
}

function buildOptions(list) {
  return list.map(v => `<option value="${v[0] + " : " + v[1]}" title="${v[1]}">${v[0]}</option>`).join("");
}

function getPersonnalitiesNames(hasCustomPersonnality) {
  let personnalitiesNames = [];
  for (var personnalitieName in PERS_CACHE) {
    personnalitiesNames.push(PERS_CACHE[personnalitieName].Name);
  }
  if (hasCustomPersonnality) {
    personnalitiesNames.push("Custom")
  }
  return personnalitiesNames;
}

function getPersonnalitieDesc(personnalitieName, mentalStatus, hasCustomPersonnality, customPersonnality,actor) {
  if (personnalitieName == '') {
    personnalitieName = 'Timide';
  }
  if (mentalStatus > 8) {
    if (hasCustomPersonnality && personnalitieName == "Custom") {
      return customPersonnality.stage1;
    }
    return PERS_CACHE.filter(p => p.Name == personnalitieName)[0].Stages.Equilibre;
  }
  if (mentalStatus > 4) {
    if (hasCustomPersonnality && personnalitieName == "Custom") {
      return customPersonnality.stage2;
    }
    return PERS_CACHE.filter(p => p.Name == personnalitieName)[0].Stages.Perturbe;
  }
  if (mentalStatus > 0 || actor.system.attributes.Avantage == "Folie douce") {
    let msg = ""
    if (hasCustomPersonnality && personnalitieName == "Custom") {
      return customPersonnality.stage3;
    }
    if(actor.system.attributes.Avantage == "Folie douce" && mentalStatus == 0){
      return PERS_CACHE.filter(p => p.Name == personnalitieName)[0].Stages.Desaxe +" "+actor  + "lutte contre la folie...";
    }
    return PERS_CACHE.filter(p => p.Name == personnalitieName)[0].Stages.Desaxe + msg;
  }
  return actor.name + "a perdu l'esprit..."

}

async function loadTraits() {
  if (TRAITS_CACHE) return TRAITS_CACHE;


  TRAITS_CACHE = await cpLoader.getTraitsFromCompendium(null);

  return TRAITS_CACHE;
}

async function loadPersonnalities() {
  if (PERS_CACHE) return PERS_CACHE;

  PERS_CACHE = await cpLoader.getPersonnalityFromCompendium();

  return PERS_CACHE;
}







