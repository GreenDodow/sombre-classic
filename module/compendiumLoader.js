
export async function getTraitsFromCompendium(category) {
    const pack = game.packs.get("world.sombre-traits");

    if (!pack) {
        console.warn("Sombre | Aucun compendium de traits détecté, fallback utilisé");
        return getTraitsFromFallBack(category);
    }

    const index = await pack.getIndex();

    const docs = await Promise.all(
        index.map(i => pack.getDocument(i._id))
    );

    if (category != null) {
        return docs
            .filter(t => t.system.Category == category)
            .maps(d => ({ Name: d.system.Name, Description: d.system.Description, Category : d.system.Category }));
    }

    let traits = [];
    for(let doc in docs){
        traits.push({Name: docs[doc].system.Name,Description: docs[doc].system.Description, Category : docs[doc].system.Category })
    }
    return traits;

}

function getTraitsFromFallBack(category) {
    let exempleTraits = [];
    exempleTraits.push({Name:"Exemple d'avantage",Description:"Ceci est un exemple d'avantage",Category:"Avantage"})
    exempleTraits.push({Name:"Exemple de désavantage",Description:"Ceci est un exemple de désavantage",Category:"Désavantage"})
    return exempleTraits;
}

export async function getPersonnalityFromCompendium() {
    const pack = game.packs.get("world.sombre-personnalities");

    if (!pack) {
        console.warn("Sombre | Aucun compendium de personnalités détecté, fallback utilisé");
        return getPersonnalityFromFallBack();
    }

    const index = await pack.getIndex();

    const docs = await Promise.all(
        index.map(i => pack.getDocument(i._id))
    );

    return docs.map(d => ({
        Name: d.system.Name,
        Stages: {
            Equilibre: d.system.Equilibre,
            Perturbe: d.system.Perturbe,
            Desaxe: d.system.Desaxe
        }
    }));

}

function getPersonnalityFromFallBack() {
    let personnalities = [];
    personnalities.push({Name:"Exemple de personnalité",Stages :{Equilibre:"Exemple de premier stade de personnalité",Perturbe:"Exemple de second stade de personnalité",Desaxe:"Exemple de dernier stade de personnalité"}})
    return personnalities;
}