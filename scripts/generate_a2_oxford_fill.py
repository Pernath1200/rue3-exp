"""
Generate A2 Oxford-fill packs + tree nodes (experiment bulk).
Run from rue3-grok-exp: py scripts/generate_a2_oxford_fill.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLOCKS = ROOT / "data" / "blocks"
TREE = ROOT / "data" / "tree.json"

# codex_unit per leaf/trunk kind
CODEX = {
    "home": "V_THM-A1B1-01",
    "work": "V_THM-A1B1-02",
    "travel": "V_THM-A1B1-03",
    "family": "V_THM-A1B1-04",
    "food": "V_THM-A1B1-05",
    "shopping": "V_THM-A1B1-06",
    "health": "V_THM-A1B1-07",
    "routine": "V_THM-A1B1-08",
    "freetime": "V_THM-A1B1-09",
    "nature": "V_THM-A1B1-09",
    "tech": "V_COR-A1B1-01",
    "school": "V_THM-A1B1-02",
    "clothes": "V_THM-A1B1-01",
    "feelings": "V_THM-A1B1-09",
    "ideas": "V_COR-A1B1-01",
    "describing": "V_COR-A1B1-01",
    "adverbs": "V_COR-A1B1-01",
    "verbs": "V_COR-A1B1-01",
    "misc": "V_COR-A1B1-01",
    "society": "V_COR-A1B1-01",
    "sports": "V_THM-A1B1-09",
    "media": "V_THM-A1B1-09",
}


def chunk12(items: list[dict]) -> list[list[dict]]:
    out = []
    for i in range(0, len(items), 12):
        block = items[i : i + 12]
        if len(block) < 8 and out:
            # pad last small block into previous if tiny; else keep if >=8
            if len(block) < 8:
                # fill with None skip — instead merge into previous
                out[-1].extend(block)
                # if previous now > 18, re-split
                if len(out[-1]) > 18:
                    big = out.pop()
                    out.append(big[:12])
                    rest = big[12:]
                    if len(rest) >= 8:
                        out.append(rest)
                    elif rest:
                        out[-1].extend(rest)
                continue
        if len(block) >= 8:
            out.append(block)
        elif block:
            # pad by repeating last? better drop to misc later
            while len(block) < 8 and items:
                # shouldn't happen often
                break
            if len(block) >= 8:
                out.append(block)
            else:
                out.append(block)  # allow thin for now; QA wants >=8 for words
    # ensure all word blocks >= 8 by merging stragglers
    fixed: list[list[dict]] = []
    buf: list[dict] = []
    for b in out:
        buf.extend(b)
        while len(buf) >= 12:
            fixed.append(buf[:12])
            buf = buf[12:]
    if len(buf) >= 8:
        fixed.append(buf)
    elif buf and fixed:
        # merge into last and rebalance
        fixed[-1].extend(buf)
        if len(fixed[-1]) > 16:
            last = fixed.pop()
            fixed.append(last[:12])
            fixed.append(last[12:])
    elif buf:
        # pad with review-friendly repeats of first items (mark in en? no — skip pad)
        # better: leave short only if we add fillers later
        while len(buf) < 8 and fixed:
            # pull from last block
            break
        if len(buf) >= 8:
            fixed.append(buf)
        else:
            # expand with near-synonym placeholders — just duplicate labels with number? bad
            # store as-is; QA may fail — pad with related core
            fixed.append(buf)
    return fixed


def items_from_pairs(pairs: list[tuple[str, str]]) -> list[dict]:
    seen = set()
    out = []
    for en, cz in pairs:
        en = en.strip()
        key = en.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append({"en": en, "cz": cz})
    return out


def write_leaf(
    pack_id: str,
    title: str,
    tree_node: str,
    codex: str,
    pairs: list[tuple[str, str]],
    note: str,
) -> dict:
    its = items_from_pairs(pairs)
    blocks_raw = chunk12(its)
    # pad short final blocks to 8 with reserve from misc later handled by caller
    blocks = []
    for i, bl in enumerate(blocks_raw):
        if len(bl) < 8:
            continue  # drop tiny; caller should add to another theme
        blocks.append(
            {
                "id": f"{pack_id}_{i+1}",
                "title": f"{title} · {i+1}",
                "items": bl,
            }
        )
    if not blocks:
        return {}
    pack = {
        "id": pack_id,
        "title": title,
        "level": "A2",
        "tree_node": tree_node,
        "codex_unit": codex,
        "note": note,
        "default_direction": "cz_to_en",
        "blocks": blocks,
    }
    path = BLOCKS / f"{pack_id}.json"
    path.write_text(json.dumps(pack, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    n = sum(len(b["items"]) for b in blocks)
    print(f"  wrote {path.name} blocks={len(blocks)} items={n}")
    return {
        "id": tree_node,
        "label": title,
        "kind": "leaf",
        "levels": ["A2"],
        "parent": "trunk",
        "status": "live",
        "content": f"blocks/{pack_id}.json",
        "codex_unit": codex,
        "note": f"Live · A2 · {codex} · {len(blocks)}×12ish · Oxford fill",
    }


def frame_item(en: str, cz: str, gap: str, gap_answer: str, accepts: list[str] | None = None) -> dict:
    d = {"en": en, "cz": cz, "gap": gap, "gap_answer": gap_answer}
    if accepts:
        d["accepts"] = accepts
    return d


def write_frames(
    pack_id: str,
    title: str,
    tree_node: str,
    codex: str,
    items: list[dict],
    note: str,
) -> dict:
    # split into 12s
    blocks = []
    for i in range(0, len(items), 12):
        bl = items[i : i + 12]
        if len(bl) < 8 and blocks:
            # merge remainder
            prev = blocks[-1]["items"]
            if len(prev) + len(bl) <= 16:
                blocks[-1]["items"].extend(bl)
                continue
        if len(bl) < 8:
            continue
        blocks.append({"id": f"{pack_id}_{i//12+1}", "title": f"{title} · {i//12+1}", "items": bl})
    if not blocks:
        return {}
    pack = {
        "id": pack_id,
        "title": title,
        "level": "A2",
        "tree_node": tree_node,
        "codex_unit": codex,
        "practice": "frames",
        "note": note,
        "default_direction": "cz_to_en",
        "blocks": blocks,
    }
    path = BLOCKS / f"{pack_id}.json"
    path.write_text(json.dumps(pack, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    n = sum(len(b["items"]) for b in blocks)
    print(f"  wrote {path.name} frames blocks={len(blocks)} items={n}")
    return {
        "id": tree_node,
        "label": title.split("·")[0].strip() if "·" in title else title,
        "kind": "trunk",
        "levels": ["A2"],
        "parent": "trunk",
        "status": "live",
        "content": f"blocks/{pack_id}.json",
        "codex_unit": codex,
        "note": f"Live · A2 frames · {codex} · {n} items",
    }


# ─── LEAF WORD LISTS (draft CZ) ───────────────────────────────────────────

HOME = [
    ("apartment", "byt (amer.)"),
    ("balcony", "balkon"),
    ("basement", "suterén / sklep"),
    ("carpet", "koberec"),
    ("ceiling", "strop"),
    ("central heating", "ústřední topení"),
    ("cupboard", "skříň / kredenc"),
    ("curtain", "závěs / záclona"),
    ("dishwasher", "myčka nádobí"),
    ("downstairs", "dole / dolejší patro"),
    ("furniture", "nábytek"),
    ("garage", "garáž"),
    ("gate", "brána / vrata"),
    ("heating", "topení"),
    ("housework", "domácí práce"),
    ("landlord", "majitel bytu / domácí"),
    ("lift", "výtah"),
    ("neighbour", "soused"),
    ("pillow", "polštář"),
    ("rent", "nájem"),
    ("roof", "střecha"),
    ("shelf", "police"),
    ("sink", "dřez / umyvadlo"),
    ("sofa", "pohovka"),
    ("stairs", "schody"),
    ("upstairs", "nahoře / horní patro"),
    ("washing machine", "pračka"),
    ("mirror", "zrcadlo"),
    ("towel", "ručník"),
    ("brush", "kartáč"),
    ("lock", "zámek / zamknout"),
    ("board", "prkno / tabule"),
    ("hall", "hala / předsíň"),
    ("sheet", "prostěradlo / list papíru"),
    ("rubbish", "odpadky"),
    ("bin", "koš (na odpad)"),
]

WORK = [
    ("apply", "požádat (o práci) / přihlásit se"),
    ("application", "žádost / přihláška"),
    ("boss", "šéf"),
    ("businessman", "obchodník / podnikatel"),
    ("career", "kariéra"),
    ("colleague", "kolega"),
    ("company", "firma / společnost"),
    ("contract", "smlouva"),
    ("department", "oddělení"),
    ("employee", "zaměstnanec"),
    ("employer", "zaměstnavatel"),
    ("interview", "pohovor"),
    ("manager", "manažer / vedoucí"),
    ("meeting", "schůzka / porada"),
    ("profession", "povolání / profese"),
    ("professional", "profesionál / odborný"),
    ("salary", "plat"),
    ("skill", "dovednost"),
    ("staff", "personál / zaměstnanci"),
    ("team", "tým"),
    ("training", "školení / výcvik"),
    ("unemployed", "nezaměstnaný"),
    ("unemployment", "nezaměstnanost"),
    ("wage", "mzda"),
    ("workplace", "pracoviště"),
    ("earn", "vydělávat"),
    ("employ", "zaměstnávat"),
    ("factory", "továrna"),
    ("industry", "průmysl / odvětví"),
    ("secretary", "sekretářka / tajemník"),
    ("officer", "úředník / důstojník"),
    ("leader", "vůdce / vedoucí"),
    ("conference", "konference"),
    ("task", "úkol"),
    ("organization", "organizace"),
    ("assistant", "asistent"),
    ("designer", "designér / návrhář"),
    ("director", "ředitel / režisér"),
    ("instructor", "instruktor"),
]

TRAVEL_EXTRA = [
    ("airline", "letecká společnost"),
    ("backpack", "batoh"),
    ("cabin", "kabina"),
    ("camp", "tábor / kempovat"),
    ("camping", "kempování"),
    ("coach", "autobus (dálkový) / trenér"),
    ("destination", "cíl cesty"),
    ("ferry", "trajekt"),
    ("foreign", "zahraniční / cizí"),
    ("passenger", "cestující"),
    ("voyage", "plavba / cesta (loď)"),
    ("railway", "železnice"),
    ("route", "trasa"),
    ("ship", "loď"),
    ("tourism", "cestovní ruch"),
    ("traveller", "cestovatel"),
    ("vehicle", "vozidlo"),
    ("lorry", "nákladní auto"),
    ("truck", "náklaďák"),
    ("motorcycle", "motocykl"),
    ("parking", "parkování"),
    ("petrol", "benzín"),
    ("pilot", "pilot"),
    ("coast", "pobřeží"),
    ("bridge", "most"),
    ("tower", "věž"),
    ("castle", "hrad / zámek"),
    ("palace", "palác"),
    ("region", "region / oblast"),
    ("continent", "kontinent"),
    ("distance", "vzdálenost"),
    ("direction", "směr"),
    ("case", "kufr / případ"),
]

FAMILY = [
    ("adult", "dospělý"),
    ("single", "svobodný"),
    ("couple", "pár"),
    ("kid", "dítě (hovor.)"),
    ("guy", "chlápek / kluk"),
    ("lady", "dáma"),
    ("sir", "pane"),
    ("relationship", "vztah"),
    ("wedding", "svatba"),
    ("birth", "narození"),
    ("guest", "host"),
    ("owner", "majitel"),
    ("behaviour", "chování"),
    ("character", "povaha / postava"),
    ("personality", "osobnost"),
    ("background", "původ / pozadí"),
    ("community", "komunita / obec"),
    ("society", "společnost"),
    ("crowd", "dav"),
    ("audience", "publikum"),
]

FOOD = [
    ("recipe", "recept (kuchařský)"),
    ("sauce", "omáčka"),
    ("oil", "olej"),
    ("beef", "hovězí"),
    ("bean", "fazole"),
    ("biscuit", "sušenka / piškot"),
    ("chip", "hranolka / čips"),
    ("lemon", "citron"),
    ("nut", "ořech"),
    ("jam", "džem"),
    ("cream", "smetana / krém"),
    ("grill", "gril / grilovat"),
    ("boil", "vařit (ve vodě)"),
    ("bake", "péct"),
    ("fry", "smažit"),
    ("chef", "šéfkuchař"),
    ("taste", "chuť / chutnat"),
    ("sweet", "sladký / bonbon"),
    ("spicy", "pálivý / kořeněný"),
    ("vegetarian", "vegetarián / vegetariánský"),
    ("pub", "hospoda"),
    ("soap", "mýdlo"),
]

SHOPPING = [
    ("advertisement", "reklama"),
    ("advertising", "reklama (obor)"),
    ("advertise", "inzerovat / reklamovat"),
    ("brand", "značka"),
    ("product", "výrobek / produkt"),
    ("store", "obchod (amer.)"),
    ("bargain", "výhodná koupě"),
    ("credit card", "kreditní karta"),
    ("cash", "hotovost"),
    ("purchase", "nákup / koupit"),
    ("penny", "penny (mince)"),
    ("quality", "kvalita"),
    ("quantity", "množství"),
    ("item", "položka / věc"),
    ("gift", "dárek"),
    ("jewellery", "šperky"),
    ("belt", "pásek"),
    ("button", "knoflík / tlačítko"),
    ("material", "materiál / látka"),
    ("size", "velikost"),
    ("fashion", "móda"),
]

HEALTH = [
    ("accident", "nehoda"),
    ("ankle", "kotník"),
    ("bone", "kost"),
    ("brain", "mozek"),
    ("disease", "nemoc (choroba)"),
    ("illness", "nemoc"),
    ("virus", "virus"),
    ("blood", "krev"),
    ("breathe", "dýchat"),
    ("cancer", "rakovina"),
    ("drug", "lék / droga"),
    ("treatment", "léčba"),
    ("injury", "zranění"),
    ("pain", "bolest"),
    ("danger", "nebezpečí"),
    ("death", "smrt"),
    ("fear", "strach"),
    ("weight", "váha"),
    ("height", "výška"),
    ("energy", "energie"),
]

ROUTINE = [
    ("habit", "zvyk"),
    ("lifestyle", "životní styl"),
    ("schedule", "rozvrh / plán"),
    ("timetable", "jízdní řád / rozvrh"),
    ("daily", "denní / denně"),
    ("everyday", "každodenní"),
    ("regular", "pravidelný"),
    ("usual", "obvyklý"),
    ("already", "už / již"),
    ("yet", "ještě / už"),
    ("still", "stále"),
    ("bit", "trochu / kousek"),
    ("alarm", "budík / alarm"),
    ("diary", "deník"),
]

FREETIME = [
    ("adventure", "dobrodružství"),
    ("series", "seriál / série"),
    ("comedy", "komedie"),
    ("drama", "drama"),
    ("fiction", "beletrie / fikce"),
    ("novel", "román"),
    ("cartoon", "kreslený film / komiks"),
    ("celebrity", "celebrita"),
    ("fan", "fanoušek"),
    ("hero", "hrdina"),
    ("stage", "jeviště / etapa"),
    ("instrument", "nástroj"),
    ("jazz", "jazz"),
    ("musical", "muzikál / hudební"),
    ("musician", "hudebník"),
    ("painter", "malíř"),
    ("drawing", "kresba"),
    ("gallery", "galerie"),
    ("entertainment", "zábava"),
    ("festival", "festival"),
    ("party", "večírek / párty"),
    ("joke", "vtip"),
    ("laughter", "smích"),
    ("dream", "sen / snít"),
    ("luck", "štěstí (náhoda)"),
    ("prize", "cena (odměna)"),
    ("award", "ocenění / cena"),
    ("competition", "soutěž"),
    ("race", "závod"),
    ("goal", "gól / cíl"),
    ("score", "skóre / skórovat"),
    ("winner", "vítěz"),
]

SPORTS = [
    ("athlete", "atlet / sportovec"),
    ("baseball", "baseball"),
    ("basketball", "basketbal"),
    ("football", "fotbal"),
    ("soccer", "fotbal (amer.)"),
    ("golf", "golf"),
    ("hockey", "hokej"),
    ("skiing", "lyžování"),
    ("sailing", "plachtění"),
    ("fishing", "rybaření"),
    ("cycling", "cyklistika"),
    ("cycle", "kolo / jet na kole"),
    ("runner", "běžec"),
    ("trainer", "trenér / tenisky"),
    ("stadium", "stadion"),
    ("match", "zápas"),
    ("team", "tým"),
    ("swim", "plavat"),
    ("ride", "jet (na) / jízda"),
    ("track", "dráha / stopa"),
]

NATURE = [
    ("climate", "klima"),
    ("environment", "životní prostředí"),
    ("ocean", "oceán"),
    ("planet", "planeta"),
    ("pollution", "znečištění"),
    ("storm", "bouře"),
    ("valley", "údolí"),
    ("wood", "les / dřevo"),
    ("desert", "poušť"),
    ("grass", "tráva"),
    ("ground", "zem / půda"),
    ("stone", "kámen"),
    ("moon", "měsíc"),
    ("wave", "vlna"),
    ("flood", "povodeň"),
    ("disaster", "katastrofa"),
    ("nature", "příroda"),
    ("season", "roční období"),
    ("spider", "pavouk"),
]

TECH = [
    ("app", "aplikace"),
    ("digital", "digitální"),
    ("download", "stáhnout"),
    ("upload", "nahrát (online)"),
    ("laptop", "notebook"),
    ("smartphone", "smartphon"),
    ("tablet", "tablet"),
    ("password", "heslo"),
    ("website", "webová stránka"),
    ("site", "stránka / místo"),
    ("network", "síť"),
    ("data", "data"),
    ("device", "zařízení"),
    ("screen", "obrazovka"),
    ("keyboard", "klávesnice"),
    ("mouse", "myš (počítač)"),
    ("printer", "tiskárna"),
    ("program", "program"),
    ("software", "software"),
    ("technology", "technologie"),
    ("code", "kód"),
    ("link", "odkaz / spojení"),
    ("profile", "profil"),
    ("media", "média"),
    ("document", "dokument"),
    ("file", "soubor"),
    ("copy", "kopie / kopírovat"),
    ("print", "tisknout"),
    ("text", "psát SMS / text"),
    ("mail", "pošta / e-mail"),
    ("blog", "blog"),
    ("image", "obrázek / snímek"),
    ("recording", "nahrávka"),
    ("record", "nahrávka / rekord"),
]

SCHOOL = [
    ("degree", "titul / stupeň"),
    ("education", "vzdělání"),
    ("learning", "učení"),
    ("mark", "známka"),
    ("essay", "esej / sloh"),
    ("lecture", "přednáška"),
    ("professor", "profesor"),
    ("student", "student"),
    ("subject", "předmět"),
    ("term", "semestr / pojem"),
    ("project", "projekt"),
    ("research", "výzkum"),
    ("researcher", "výzkumník"),
    ("experiment", "experiment"),
    ("lab", "laboratoř"),
    ("biology", "biologie"),
    ("chemistry", "chemie"),
    ("physics", "fyzika"),
    ("mathematics", "matematika"),
    ("maths", "matika"),
    ("history", "dějepis / historie"),
    ("geography", "zeměpis"),
    ("library", "knihovna"),
    ("dictionary", "slovník"),
    ("instruction", "instrukce / návod"),
    ("introduction", "úvod / představení"),
    ("explanation", "vysvětlení"),
    ("understanding", "porozumění"),
    ("memory", "paměť"),
    ("mind", "mysl"),
    ("thought", "myšlenka"),
    ("thinking", "přemýšlení"),
    ("knowledge", "znalosti"),
    ("teaching", "výuka"),
]

CLOTHES = [
    ("fashion", "móda"),
    ("clothing", "oblečení"),
    ("uniform", "uniforma"),
    ("pants", "kalhoty (amer.)"),
    ("jumper", "svetr"),
    ("glove", "rukavice"),
    ("ring", "prsten"),
    ("jewellery", "šperky"),
    ("smart", "elegantní / chytrý"),
    ("casual", "neformální"),
    ("belt", "pásek"),
    ("button", "knoflík"),
]

FEELINGS = [
    ("nervous", "nervózní"),
    ("surprised", "překvapený"),
    ("surprise", "překvapení"),
    ("unhappy", "nešťastný"),
    ("afraid", "vyděšený / bát se"),
    ("angry", "naštvaný"),
    ("bored", "znuděný"),
    ("calm", "klidný"),
    ("confident", "sebevědomý"),
    ("embarrassed", "v rozpacích"),
    ("excited", "nadšený"),
    ("jealous", "žárlivý"),
    ("proud", "pyšný"),
    ("relaxed", "uvolněný"),
    ("worried", "ustaraný"),
    ("lonely", "osamělý"),
    ("confused", "zmatený"),
    ("cheerful", "veselý"),
    ("serious", "vážný"),
    ("friendly", "přátelský"),
    ("kind", "laskavý"),
    ("polite", "zdvořilý"),
    ("rude", "nezdvořilý"),
    ("honest", "upřímný"),
]

IDEAS = [
    ("ability", "schopnost"),
    ("advantage", "výhoda"),
    ("disadvantage", "nevýhoda"),
    ("argument", "hádka / argument"),
    ("decision", "rozhodnutí"),
    ("opportunity", "příležitost"),
    ("solution", "řešení"),
    ("problem", "problém"),
    ("reason", "důvod"),
    ("result", "výsledek"),
    ("effect", "účinek / následek"),
    ("cause", "příčina"),
    ("choice", "volba"),
    ("option", "možnost"),
    ("possibility", "možnost"),
    ("chance", "šance"),
    ("purpose", "účel"),
    ("method", "metoda"),
    ("process", "proces"),
    ("system", "systém"),
    ("strategy", "strategie"),
    ("structure", "struktura"),
    ("feature", "rys / funkce"),
    ("factor", "faktor"),
    ("condition", "stav / podmínka"),
    ("situation", "situace"),
    ("context", "kontext"),
    ("evidence", "důkaz"),
    ("fact", "fakt"),
    ("detail", "detail"),
    ("example", "příklad"),
    ("difference", "rozdíl"),
    ("similarity", "podobnost"),
    ("benefit", "přínos / dávka"),
    ("progress", "pokrok"),
    ("success", "úspěch"),
    ("failure", "neúspěch"),
    ("error", "chyba"),
    ("mistake", "chyba"),
    ("suggestion", "návrh"),
    ("advice", "rada"),
    ("opinion", "názor"),
    ("attention", "pozornost"),
    ("interest", "zájem"),
    ("focus", "soustředit se / ohnisko"),
    ("sense", "smysl / cit"),
    ("manner", "způsob / chování"),
    ("permission", "povolení"),
    ("promise", "slib"),
    ("request", "žádost"),
    ("reply", "odpověď"),
    ("response", "reakce / odpověď"),
    ("comment", "komentář"),
    ("discussion", "diskuse"),
    ("speech", "projev / řeč"),
    ("expression", "výraz"),
    ("message", "zpráva"),
    ("notice", "oznámení / všimnout si"),
    ("sign", "značka / znamení"),
    ("symbol", "symbol"),
    ("pattern", "vzor"),
    ("shape", "tvar"),
    ("level", "úroveň"),
    ("rate", "míra / sazba"),
    ("amount", "množství"),
    ("number", "číslo / počet"),
    ("figure", "číslo / postava"),
    ("value", "hodnota"),
    ("power", "síla / moc"),
    ("control", "kontrola / ovládat"),
    ("support", "podpora"),
    ("service", "služba"),
    ("role", "role"),
    ("position", "pozice"),
    ("possession", "majetek / vlastnictví"),
    ("arrangement", "domluva / uspořádání"),
    ("alternative", "alternativa"),
    ("variety", "rozmanitost"),
    ("source", "zdroj"),
    ("target", "cíl"),
    ("tip", "tip / spropitné"),
    ("tool", "nástroj"),
    ("equipment", "vybavení"),
    ("machine", "stroj"),
    ("engine", "motor"),
    ("electricity", "elektřina"),
    ("gas", "plyn / benzín (amer.)"),
    ("metal", "kov"),
    ("plastic", "plast"),
    ("invention", "vynález"),
    ("discovery", "objev"),
    ("experiment", "experiment"),
]

SOCIETY = [
    ("government", "vláda"),
    ("president", "prezident"),
    ("law", "zákon"),
    ("lawyer", "právník"),
    ("crime", "zločin"),
    ("criminal", "zločinec"),
    ("prison", "vězení"),
    ("thief", "zloděj"),
    ("police", "policie"),
    ("soldier", "voják"),
    ("army", "armáda"),
    ("war", "válka"),
    ("peace", "mír"),
    ("gun", "zbraň / pistole"),
    ("attack", "útok"),
    ("fight", "rvačka / bojovat"),
    ("king", "král"),
    ("queen", "královna"),
    ("church", "kostel"),
    ("god", "bůh"),
    ("religion", "náboženství"),
    ("tradition", "tradice"),
    ("culture", "kultura"),
    ("population", "obyvatelstvo"),
    ("nation", "národ"),
    ("state", "stát / stav"),
    ("charity", "charita"),
    ("vote", "hlasovat / hlas"),
    ("election", "volby"),
    ("tax", "daň"),
    ("rule", "pravidlo"),
]

MEDIA = [
    ("author", "autor"),
    ("journalist", "novinář"),
    ("reporter", "reportér"),
    ("article", "článek"),
    ("magazine", "časopis"),
    ("newspaper", "noviny"),
    ("poster", "plakát"),
    ("review", "recenze"),
    ("scene", "scéna"),
    ("ending", "konec (příběhu)"),
    ("comedy", "komedie"),
    ("drama", "drama"),
    ("film", "film / natáčet"),
    ("photograph", "fotografie / fotit"),
    ("camera", "fotoaparát"),
    ("speaker", "mluvčí / reproduktor"),
    ("listener", "posluchač"),
    ("voice", "hlas"),
    ("noise", "hluk"),
    ("smell", "zápach / čichat"),
    ("smile", "úsměv / usmívat se"),
    ("shout", "křičet / výkřik"),
    ("chat", "pokec / chatovat"),
    ("conversation", "rozhovor"),
]

DESCRIBING = [
    ("able", "schopný"),
    ("active", "aktivní"),
    ("alive", "živý"),
    ("alone", "sám"),
    ("ancient", "starověký / prastarý"),
    ("asleep", "spící"),
    ("attractive", "přitažlivý"),
    ("available", "dostupný"),
    ("average", "průměrný"),
    ("awful", "příšerný"),
    ("basic", "základní"),
    ("beautiful", "krásný"),
    ("blind", "slepý"),
    ("bright", "jasný / bystrý"),
    ("brilliant", "skvělý / geniální"),
    ("broad", "široký"),
    ("busy", "zaneprázdněný"),
    ("careful", "opatrný"),
    ("certain", "jistý"),
    ("clear", "jasný / zřejmý"),
    ("clever", "chytrý"),
    ("common", "běžný / společný"),
    ("complete", "úplný"),
    ("complex", "složitý"),
    ("cool", "chladný / super"),
    ("correct", "správný"),
    ("crazy", "bláznivý"),
    ("curious", "zvědavý"),
    ("dangerous", "nebezpečný"),
    ("dark", "tmavý"),
    ("dead", "mrtvý"),
    ("deep", "hluboký"),
    ("difficult", "obtížný"),
    ("dirty", "špinavý"),
    ("double", "dvojitý"),
    ("dry", "suchý"),
    ("early", "brzký / brzy"),
    ("eastern", "východní"),
    ("economic", "ekonomický"),
    ("educational", "vzdělávací"),
    ("efficient", "efektivní"),
    ("electric", "elektrický"),
    ("empty", "prázdný"),
    ("enormous", "obrovský"),
    ("entire", "celý"),
    ("environmental", "environmentální"),
    ("equal", "rovný / stejný"),
    ("exact", "přesný"),
    ("excellent", "výborný"),
    ("existing", "existující"),
    ("expected", "očekávaný"),
    ("expert", "odborný / expert"),
    ("extreme", "extrémní"),
    ("fair", "spravedlivý / světlý"),
    ("familiar", "známý / povědomý"),
    ("famous", "slavný"),
    ("far", "daleký / daleko"),
    ("fast", "rychlý"),
    ("female", "ženský"),
    ("final", "konečný / finále"),
    ("financial", "finanční"),
    ("flat", "byt / plochý"),
    ("foreign", "zahraniční"),
    ("formal", "formální"),
    ("former", "bývalý"),
    ("free", "volný / zdarma"),
    ("frequent", "častý"),
    ("fresh", "čerstvý"),
    ("friendly", "přátelský"),
    ("full", "plný"),
    ("general", "obecný"),
    ("glad", "rád"),
    ("global", "globální"),
    ("good", "dobrý"),
    ("great", "skvělý / velký"),
    ("growing", "rostoucí"),
    ("healthy", "zdravý"),
    ("heavy", "těžký"),
    ("helpful", "nápomocný"),
    ("hidden", "skrytý"),
    ("high", "vysoký"),
    ("historical", "historický"),
    ("horrible", "hrozný"),
    ("huge", "obrovský"),
    ("human", "lidský"),
    ("hungry", "hladový"),
    ("ideal", "ideální"),
    ("ill", "nemocný"),
    ("immediate", "okamžitý"),
    ("important", "důležitý"),
    ("impossible", "nemožný"),
    ("impressive", "působivý"),
    ("independent", "nezávislý"),
    ("individual", "individuální / jedinec"),
    ("indoor", "vnitřní"),
    ("industrial", "průmyslový"),
    ("informal", "neformální"),
    ("injured", "zraněný"),
    ("inner", "vnitřní"),
    ("innocent", "nevinný"),
    ("intelligent", "inteligentní"),
    ("international", "mezinárodní"),
    ("junior", "mladší / juniorský"),
    ("latest", "nejnovější"),
    ("lazy", "líný"),
    ("legal", "legální / právní"),
    ("light", "lehký / světlo"),
    ("likely", "pravděpodobný"),
    ("limited", "omezený"),
    ("local", "místní"),
    ("lonely", "osamělý"),
    ("long", "dlouhý"),
    ("loose", "volný (ne těsný)"),
    ("loud", "hlasitý"),
    ("lovely", "krásný / milý"),
    ("low", "nízký"),
    ("lucky", "šťastný (náhoda)"),
    ("mad", "šílený / naštvaný"),
    ("magic", "kouzelný / kouzlo"),
    ("male", "mužský"),
    ("married", "ženatý / vdaná"),
    ("medical", "lékařský"),
    ("mental", "duševní"),
    ("messy", "nepořádný"),
    ("military", "vojenský"),
    ("modern", "moderní"),
    ("musical", "hudební"),
    ("narrow", "úzký"),
    ("national", "národní"),
    ("natural", "přírodní / přirozený"),
    ("necessary", "nutný"),
    ("negative", "záporný / negativní"),
    ("northern", "severní"),
    ("obvious", "zřejmý"),
    ("odd", "zvláštní / lichý"),
    ("official", "oficiální"),
    ("old-fashioned", "staromódní"),
    ("only", "jediný / jen"),
    ("open", "otevřený"),
    ("opposite", "opačný / naproti"),
    ("ordinary", "obyčejný"),
    ("original", "původní / originální"),
    ("outdoor", "venkovní"),
    ("outer", "vnější"),
    ("particular", "konkrétní / zvláštní"),
    ("past", "minulý / minulost"),
    ("patient", "trpělivý / pacient"),
    ("perfect", "dokonalý"),
    ("personal", "osobní"),
    ("physical", "fyzický"),
    ("pleasant", "příjemný"),
    ("political", "politický"),
    ("poor", "chudý / špatný"),
    ("popular", "oblíbený"),
    ("positive", "kladný / pozitivní"),
    ("possible", "možný"),
    ("powerful", "mocný / silný"),
    ("practical", "praktický"),
    ("present", "přítomný / dárek"),
    ("previous", "předchozí"),
    ("private", "soukromý"),
    ("probable", "pravděpodobný"),
    ("public", "veřejný"),
    ("pure", "čistý"),
    ("quick", "rychlý"),
    ("quiet", "tichý"),
    ("rare", "vzácný"),
    ("raw", "syrový"),
    ("ready", "připravený"),
    ("real", "skutečný"),
    ("realistic", "realistický"),
    ("reasonable", "rozumný"),
    ("recent", "nedávný"),
    ("regular", "pravidelný"),
    ("related", "související"),
    ("relative", "příbuzný / relativní"),
    ("relevant", "relevantní"),
    ("reliable", "spolehlivý"),
    ("religious", "náboženský"),
    ("responsible", "zodpovědný"),
    ("rich", "bohatý"),
    ("right", "správný / pravý"),
    ("rough", "hrubý / přibližný"),
    ("round", "kulatý"),
    ("safe", "bezpečný"),
    ("same", "stejný"),
    ("satisfied", "spokojený"),
    ("scared", "vyděšený"),
    ("scientific", "vědecký"),
    ("secondary", "sekundární / střední"),
    ("secret", "tajný / tajemství"),
    ("senior", "starší"),
    ("separate", "oddělený"),
    ("serious", "vážný"),
    ("sharp", "ostrý"),
    ("shiny", "lesklý"),
    ("shocked", "šokovaný"),
    ("short", "krátký / malý"),
    ("shy", "stydlivý"),
    ("sick", "nemocný"),
    ("silent", "tichý / mlčenlivý"),
    ("silly", "hloupý / směšný"),
    ("similar", "podobný"),
    ("simple", "jednoduchý"),
    ("single", "svobodný / jednotlivý"),
    ("skilled", "zručný"),
    ("slim", "štíhlý"),
    ("slow", "pomalý"),
    ("small", "malý"),
    ("smart", "chytrý / elegantní"),
    ("smooth", "hladký"),
    ("social", "společenský"),
    ("soft", "měkký"),
    ("solid", "pevný"),
    ("sorry", "líto / promiň"),
    ("southern", "jižní"),
    ("special", "zvláštní"),
    ("specific", "konkrétní"),
    ("spicy", "pálivý"),
    ("spiritual", "duchovní"),
    ("square", "čtvercový / náměstí"),
    ("standard", "standardní / norma"),
    ("strange", "divný"),
    ("strict", "přísný"),
    ("strong", "silný"),
    ("stupid", "hloupý"),
    ("successful", "úspěšný"),
    ("sudden", "náhlý"),
    ("suitable", "vhodný"),
    ("super", "super"),
    ("sure", "jistý"),
    ("surprised", "překvapený"),
    ("sweet", "sladký / milý"),
    ("tall", "vysoký"),
    ("technical", "technický"),
    ("terrible", "strašný"),
    ("thin", "tenký / hubený"),
    ("thirsty", "žíznivý"),
    ("tight", "těsný"),
    ("tiny", "malinký"),
    ("tired", "unavený"),
    ("top", "horní / nejlepší"),
    ("total", "celkový"),
    ("traditional", "tradiční"),
    ("true", "pravdivý"),
    ("typical", "typický"),
    ("ugly", "ošklivý"),
    ("unable", "neschopný"),
    ("unfair", "nespravedlivý"),
    ("unhappy", "nešťastný"),
    ("unique", "jedinečný"),
    ("united", "spojený"),
    ("unlikely", "nepravděpodobný"),
    ("unusual", "neobvyklý"),
    ("upper", "horní"),
    ("upset", "rozrušený"),
    ("useful", "užitečný"),
    ("usual", "obvyklý"),
    ("valuable", "cenný"),
    ("various", "různý"),
    ("vast", "rozsáhlý"),
    ("violent", "násilný"),
    ("visible", "viditelný"),
    ("visual", "vizuální"),
    ("warm", "teplý"),
    ("weak", "slabý"),
    ("wealthy", "bohatý"),
    ("weekly", "týdenní"),
    ("welcome", "vítaný / vítejte"),
    ("western", "západní"),
    ("wet", "mokrý"),
    ("whole", "celý"),
    ("wide", "široký"),
    ("wild", "divoký"),
    ("willing", "ochotný"),
    ("wise", "moudrý"),
    ("wonderful", "nádherný"),
    ("wooden", "dřevěný"),
    ("working", "pracující / fungující"),
    ("worried", "ustaraný"),
    ("wrong", "špatný / chybný"),
    ("young", "mladý"),
]

ADVERBS = [
    ("actually", "vlastně / ve skutečnosti"),
    ("almost", "skoro"),
    ("along", "podél / dál"),
    ("anyway", "stejně / každopádně"),
    ("anywhere", "kdekoli"),
    ("badly", "špatně"),
    ("carefully", "opatrně"),
    ("certainly", "rozhodně"),
    ("clearly", "jasně"),
    ("completely", "úplně"),
    ("constantly", "neustále"),
    ("correctly", "správně"),
    ("definitely", "rozhodně"),
    ("directly", "přímo"),
    ("easily", "snadno"),
    ("especially", "zejména"),
    ("eventually", "nakonec"),
    ("exactly", "přesně"),
    ("extremely", "extrémně"),
    ("fairly", "poměrně"),
    ("finally", "nakonec"),
    ("fortunately", "naštěstí"),
    ("generally", "obecně"),
    ("hardly", "stěží"),
    ("immediately", "okamžitě"),
    ("increasingly", "stále více"),
    ("inside", "uvnitř"),
    ("instead", "místo toho"),
    ("nearly", "téměř"),
    ("normally", "normálně"),
    ("obviously", "očividně"),
    ("outside", "venku"),
    ("particularly", "zejména"),
    ("perfectly", "perfektně"),
    ("perhaps", "možná"),
    ("probably", "pravděpodobně"),
    ("quickly", "rychle"),
    ("quietly", "tiše"),
    ("rarely", "zřídka"),
    ("recently", "nedávno"),
    ("seriously", "vážně"),
    ("simply", "jednoduše"),
    ("slightly", "mírně"),
    ("slowly", "pomalu"),
    ("somewhere", "někde"),
    ("suddenly", "najednou"),
    ("together", "spolu"),
    ("totally", "totálně"),
    ("unfortunately", "bohužel"),
    ("usually", "obvykle"),
    ("well", "dobře"),
]

VERBS = [
    ("accept", "přijmout"),
    ("achieve", "dosáhnout"),
    ("act", "jednat / hrát"),
    ("affect", "ovlivnit"),
    ("allow", "dovolit"),
    ("appear", "objevit se / zdát se"),
    ("argue", "hádat se / argumentovat"),
    ("arrange", "zařídit / uspořádat"),
    ("attend", "zúčastnit se"),
    ("avoid", "vyhnout se"),
    ("beat", "porazit / bít"),
    ("behave", "chovat se"),
    ("belong", "patřit"),
    ("blow", "foukat"),
    ("borrow", "půjčit si"),
    ("burn", "hořet / spálit"),
    ("catch", "chytit"),
    ("celebrate", "slavit"),
    ("collect", "sbírat"),
    ("communicate", "komunikovat"),
    ("compete", "soutěžit"),
    ("complain", "stěžovat si"),
    ("connect", "připojit"),
    ("consider", "zvážit"),
    ("contain", "obsahovat"),
    ("continue", "pokračovat"),
    ("count", "počítat"),
    ("cover", "pokrýt / krýt"),
    ("cry", "plakat / křičet"),
    ("deal", "jednat / vypořádat se"),
    ("depend", "záviset"),
    ("destroy", "zničit"),
    ("develop", "rozvíjet"),
    ("disagree", "nesouhlasit"),
    ("disappear", "zmizet"),
    ("discover", "objevit"),
    ("drop", "upustit / klesnout"),
    ("enter", "vstoupit"),
    ("exist", "existovat"),
    ("expect", "očekávat"),
    ("express", "vyjádřit"),
    ("fail", "neuspět"),
    ("feed", "krmit"),
    ("fix", "tvořit / formulář"),
    ("greet", "pozdravit"),
    ("hide", "schovat se"),
    ("hold", "držet"),
    ("identify", "identifikovat"),
    ("invent", "vynalézt"),
    ("invite", "pozvat"),
    ("involve", "zahrnovat"),
    ("kill", "zabít"),
    ("knock", "zaklepat"),
    ("land", "přistát"),
    ("lead", "vést"),
    ("lend", "půjčit (někomu)"),
    ("manage", "zvládnout / řídit"),
    ("marry", "oženit se / vdát se"),
    ("mention", "zmínit"),
    ("organize", "zorganizovat"),
    ("own", "vlastnit"),
    ("pack", "zabalit"),
    ("pass", "projít / podat"),
    ("perform", "vystoupit / provést"),
    ("pick", "vybrat / trhat"),
    ("plant", "zasadit / rostlina"),
    ("please", "potěšit / prosím"),
    ("predict", "předpovědět"),
    ("prevent", "zabránit"),
    ("produce", "vyrobit / produkovat"),
    ("pronounce", "vyslovit"),
    ("protect", "chránit"),
    ("provide", "poskytnout"),
    ("publish", "vydávat / publikovat"),
    ("pull", "táhnout"),
    ("push", "tlačit"),
    ("raise", "zvednout / vychovat"),
    ("reach", "dosáhnout / dojet"),
    ("react", "reagovat"),
    ("realize", "uvědomit si"),
    ("receive", "obdržet"),
    ("recognize", "poznat / uznat"),
    ("recommend", "doporučit"),
    ("recycle", "recyklovat"),
    ("reduce", "snížit"),
    ("refer", "odkazovat"),
    ("refuse", "odmítnout"),
    ("remove", "odstranit"),
    ("repair", "opravit"),
    ("replace", "nahradit"),
    ("report", "nahlásit / reportáž"),
    ("respond", "odpovědět"),
    ("rise", "stoupat"),
    ("sail", "plout"),
    ("save", "ušetřit / zachránit"),
    ("serve", "podávat / sloužit"),
    ("shake", "třást / potřást"),
    ("solve", "vyřešit"),
    ("steal", "krást"),
    ("succeed", "uspět"),
    ("suggest", "navrhnout"),
    ("suppose", "předpokládat"),
    ("throw", "házet"),
    ("touch", "dotknout se"),
    ("train", "trénovat"),
    ("worry", "dělat si starosti"),
    ("wish", "přát si"),
    ("search", "hledat"),
    ("check", "zkontrolovat"),
    ("increase", "zvýšit se"),
    ("reduce", "snížit"),
    ("improve", "zlepšit"),
]

MISC = [
    ("appearance", "vzhled"),
    ("architect", "architekt"),
    ("architecture", "architektura"),
    ("cigarette", "cigareta"),
    ("smoking", "kouření"),
    ("circle", "kruh"),
    ("column", "sloupec / sloupek"),
    ("cross", "kříž / přejít"),
    ("fall", "podzim / pád"),
    ("farming", "zemědělství"),
    ("gap", "mezera"),
    ("hit", "zásah / hit"),
    ("hole", "díra"),
    ("invitation", "pozvánka"),
    ("matter", "záležitost / záležet"),
    ("movement", "pohyb / hnutí"),
    ("parking", "parkování"),
    ("reception", "recepce / příjem"),
    ("seat", "sedadlo"),
    ("singing", "zpěv"),
    ("speed", "rychlost"),
    ("step", "krok"),
    ("survey", "průzkum"),
    ("trouble", "potíž"),
    ("unit", "jednotka"),
    ("user", "uživatel"),
    ("van", "dodávka"),
    ("wheel", "kolo (vozidla)"),
    ("wish", "přání"),
    ("stamp", "známka / razítko"),
    ("toy", "hračka"),
    ("model", "model"),
    ("pair", "pár"),
    ("piece", "kousek"),
    ("set", "sada / soubor"),
    ("sort", "druh / třídit"),
    ("type", "typ"),
    ("way", "způsob / cesta"),
    ("end", "konec"),
    ("start", "začátek"),
    ("middle", "prostředek"),
    ("side", "strana"),
    ("edge", "okraj"),
    ("point", "bod / pointa"),
    ("line", "řada / linka"),
    ("list", "seznam"),
    ("page", "stránka"),
    ("chapter", "kapitola"),
    ("letter", "dopis / písmeno"),
    ("note", "poznámka"),
    ("card", "karta"),
    ("ticket", "lístek"),
    ("key", "klíč"),
    ("bag", "taška"),
    ("box", "krabice"),
    ("bottle", "láhev"),
    ("cup", "hrnek"),
    ("glass", "sklenice"),
    ("plate", "talíř"),
    ("bowl", "miska"),
]


def trunk_frames_data() -> list[tuple[str, str, str, str, list[dict]]]:
    """Return list of (pack_id, title, node_id, codex, items)."""
    irreg = [
        frame_item("I went to school.", "Šel jsem do školy. / Šla jsem do školy.", "I ____ to school.", "went"),
        frame_item("She saw a film.", "Viděla film.", "She ____ a film.", "saw", ["She saw a movie."]),
        frame_item("We took the bus.", "Jeli jsme autobusem.", "We ____ the bus.", "took"),
        frame_item("He made a cake.", "Upekl dort.", "He ____ a cake.", "made"),
        frame_item("I had lunch.", "Obědval jsem. / Obědvala jsem.", "I ____ lunch.", "had"),
        frame_item("They came home late.", "Přišli domů pozdě.", "They ____ home late.", "came"),
        frame_item("I got a new phone.", "Dostal jsem nový telefon.", "I ____ a new phone.", "got"),
        frame_item("She gave me a gift.", "Dal mi dárek. / Dala mi dárek.", "She ____ me a gift.", "gave"),
        frame_item("We found the keys.", "Našli jsme klíče.", "We ____ the keys.", "found"),
        frame_item("He said hello.", "Řekl ahoj.", "He ____ hello.", "said"),
        frame_item("I told her the truth.", "Řekl jsem jí pravdu.", "I ____ her the truth.", "told"),
        frame_item("She left at six.", "Odešla v šest.", "She ____ at six.", "left"),
    ]
    irreg2 = [
        frame_item("I knew the answer.", "Znal jsem odpověď.", "I ____ the answer.", "knew"),
        frame_item("He felt tired.", "Cítil se unavený.", "He ____ tired.", "felt"),
        frame_item("We bought bread.", "Koupili jsme chleba.", "We ____ bread.", "bought"),
        frame_item("She brought a friend.", "Přivedla kamaráda.", "She ____ a friend.", "brought"),
        frame_item("I thought about it.", "Přemýšlel jsem o tom.", "I ____ about it.", "thought"),
        frame_item("They became friends.", "Stali se přáteli.", "They ____ friends.", "became"),
        frame_item("I began work at nine.", "Začal jsem pracovat v devět.", "I ____ work at nine.", "began"),
        frame_item("He drove to work.", "Jel do práce autem.", "He ____ to work.", "drove"),
        frame_item("She wrote an email.", "Napsala e-mail.", "She ____ an email.", "wrote"),
        frame_item("We read the book.", "Přečetli jsme knihu.", "We ____ the book.", "read"),
        frame_item("I swam in the sea.", "Plaval jsem v moři.", "I ____ in the sea.", "swam"),
        frame_item("He ran fast.", "Běžel rychle.", "He ____ fast.", "ran"),
    ]
    perfect = [
        frame_item("I've been to London.", "Byl jsem v Londýně. / Byla jsem v Londýně.", "I've ____ to London.", "been"),
        frame_item("Have you ever seen this film?", "Už jsi někdy viděl tenhle film?", "Have you ever ____ this film?", "seen"),
        frame_item("I've never eaten sushi.", "Nikdy jsem nejedl suši.", "I've never ____ sushi.", "eaten"),
        frame_item("She's just arrived.", "Právě dorazila.", "She's just ____.", "arrived"),
        frame_item("We've finished the work.", "Dokončili jsme práci.", "We've ____ the work.", "finished"),
        frame_item("I've lost my keys.", "Ztratil jsem klíče.", "I've ____ my keys.", "lost"),
        frame_item("He hasn't called yet.", "Ještě nezavolal.", "He hasn't ____ yet.", "called"),
        frame_item("Have you done your homework?", "Už jsi udělal úkoly?", "Have you ____ your homework?", "done"),
        frame_item("I've lived here for two years.", "Bydlím tady dva roky.", "I've ____ here for two years.", "lived"),
        frame_item("They've known each other since school.", "Znají se od školy.", "They've ____ each other since school.", "known"),
        frame_item("I've already paid.", "Už jsem zaplatil.", "I've already ____.", "paid"),
        frame_item("We haven't decided yet.", "Ještě jsme se nerozhodli.", "We haven't ____ yet.", "decided"),
    ]
    future = [
        frame_item("I'm going to travel next year.", "Příští rok budu cestovat.", "I'm ____ to travel next year.", "going"),
        frame_item("She's going to study medicine.", "Bude studovat medicínu.", "She's ____ to study medicine.", "going"),
        frame_item("We'll call you tomorrow.", "Zavoláme ti zítra.", "We ____ call you tomorrow.", "will", ["We'll call you tomorrow."]),
        frame_item("I think it will rain.", "Myslím, že bude pršet.", "I think it ____ rain.", "will"),
        frame_item("I'm meeting her on Friday.", "V pátek se s ní sejdu.", "I'm ____ her on Friday.", "meeting"),
        frame_item("They're flying to Rome.", "Letí do Říma.", "They're ____ to Rome.", "flying"),
        frame_item("What are you going to do?", "Co budeš dělat?", "What are you ____ to do?", "going"),
        frame_item("I'll help you.", "Pomůžu ti.", "I ____ help you.", "will", ["I'll help you."]),
        frame_item("He won't come.", "Nepřijde.", "He ____ come.", "won't", ["He will not come."]),
        frame_item("Are you going to buy it?", "Koupíš to?", "Are you ____ to buy it?", "going"),
        frame_item("We're going to move house.", "Budeme se stěhovat.", "We're ____ to move house.", "going"),
        frame_item("I'll see you later.", "Uvidíme se později.", "I ____ see you later.", "will", ["I'll see you later."]),
    ]
    compare = [
        frame_item("This book is better than that one.", "Tahle kniha je lepší než ta.", "This book is ____ than that one.", "better"),
        frame_item("She is taller than me.", "Je vyšší než já.", "She is ____ than me.", "taller"),
        frame_item("Today is colder than yesterday.", "Dnes je chladněji než včera.", "Today is ____ than yesterday.", "colder"),
        frame_item("This is more expensive.", "Tohle je dražší.", "This is ____ expensive.", "more"),
        frame_item("English is easier than Chinese.", "Angličtina je snazší než čínština.", "English is ____ than Chinese.", "easier"),
        frame_item("He is the best student.", "Je nejlepší student.", "He is the ____ student.", "best"),
        frame_item("This is the biggest room.", "Tohle je největší pokoj.", "This is the ____ room.", "biggest"),
        frame_item("She's the most interesting person.", "Je nejzajímavější člověk.", "She's the ____ interesting person.", "most"),
        frame_item("My car is faster than yours.", "Moje auto je rychlejší než tvoje.", "My car is ____ than yours.", "faster"),
        frame_item("Life is harder now.", "Život je teď těžší.", "Life is ____ now.", "harder"),
        frame_item("This film is worse than the book.", "Ten film je horší než kniha.", "This film is ____ than the book.", "worse"),
        frame_item("He's as tall as his brother.", "Je stejně vysoký jako jeho bratr.", "He's ____ tall as his brother.", "as"),
    ]
    quantity = [
        frame_item("I need some milk.", "Potřebuju nějaké mléko.", "I need ____ milk.", "some"),
        frame_item("Have you got any bread?", "Máš nějaký chleba?", "Have you got ____ bread?", "any"),
        frame_item("There isn't much time.", "Není moc času.", "There isn't ____ time.", "much"),
        frame_item("There are many people.", "Je tam hodně lidí.", "There are ____ people.", "many"),
        frame_item("I have a lot of work.", "Mám spoustu práce.", "I have a ____ of work.", "lot"),
        frame_item("How much does it cost?", "Kolik to stojí?", "How ____ does it cost?", "much"),
        frame_item("How many apples?", "Kolik jablek?", "How ____ apples?", "many"),
        frame_item("I don't have enough money.", "Nemám dost peněz.", "I don't have ____ money.", "enough"),
        frame_item("Too much sugar is bad.", "Příliš cukru je špatně.", "Too ____ sugar is bad.", "much"),
        frame_item("There are a few chairs.", "Je tu pár židlí.", "There are a ____ chairs.", "few"),
        frame_item("I need a little help.", "Potřebuju trochu pomoci.", "I need a ____ help.", "little"),
        frame_item("All of the students came.", "Přišli všichni studenti.", "____ of the students came.", "All"),
    ]
    chunks = [
        frame_item("According to the news, it's true.", "Podle zpráv je to pravda.", "____ to the news, it's true.", "According"),
        frame_item("Are you all right?", "Jsi v pořádku?", "Are you ____ right?", "all"),
        frame_item("I don't live here any more.", "Už tu nebydlím.", "I don't live here ____ more.", "any"),
        frame_item("Ten per cent of people agree.", "Deset procent lidí souhlasí.", "Ten ____ cent of people agree.", "per"),
        frame_item("I used to play football.", "Dřív jsem hrál fotbal.", "I ____ to play football.", "used"),
        frame_item("What about you?", "A co ty?", "What ____ you?", "about"),
        frame_item("Of course I can help.", "Samozřejmě můžu pomoct.", "Of ____ I can help.", "course"),
        frame_item("I'm not sure.", "Nejsem si jistý.", "I'm not ____.", "sure"),
        frame_item("It depends on the weather.", "Záleží na počasí.", "It depends ____ the weather.", "on"),
        frame_item("I'd like a coffee, please.", "Dal bych si kávu, prosím.", "I'd ____ a coffee, please.", "like"),
        frame_item("Could you help me?", "Mohl bys mi pomoct?", "____ you help me?", "Could"),
        frame_item("Do you mind waiting?", "Vadí ti počkat?", "Do you ____ waiting?", "mind"),
    ]
    glue = [
        frame_item("I stayed although it rained.", "Zůstal jsem, i když pršelo.", "I stayed ____ it rained.", "although"),
        frame_item("The shop is against the wall.", "Obchod je u zdi. / proti zdi.", "The shop is ____ the wall.", "against"),
        frame_item("She sat among her friends.", "Seděla mezi přáteli.", "She sat ____ her friends.", "among"),
        frame_item("Everybody came except Tom.", "Přišli všichni kromě Toma.", "Everybody came ____ Tom.", "except"),
        frame_item("Is anybody at home?", "Je doma někdo?", "Is ____ at home?", "anybody"),
        frame_item("This book is hers.", "Tahle kniha je její.", "This book is ____.", "hers"),
        frame_item("The bag is mine.", "Ta taška je moje.", "The bag is ____.", "mine"),
        frame_item("Is this yours?", "Je tohle tvoje?", "Is this ____?", "yours"),
        frame_item("We walked towards the station.", "Šli jsme směrem k nádraží.", "We walked ____ the station.", "towards"),
        frame_item("The cat jumped onto the table.", "Kočka skočila na stůl.", "The cat jumped ____ the table.", "onto"),
        frame_item("He ran into the room.", "Vběhl do pokoje.", "He ran ____ the room.", "into"),
        frame_item("Take the keys with you.", "Vezmi si klíče s sebou.", "Take the keys ____ you.", "with"),
    ]
    return [
        ("a2_core_frames_past_irreg", "Past · irregulars", "trunk_past_irreg_a2", "V_COR-A1B1-01", irreg + irreg2),
        ("a2_core_frames_perfect", "Present perfect", "trunk_perfect_a2", "V_COR-A1B1-01", perfect),
        ("a2_core_frames_future", "Future · going to / will", "trunk_future_a2", "V_COR-A1B1-01", future),
        ("a2_core_frames_compare", "Comparatives", "trunk_compare_a2", "V_COR-A1B1-01", compare),
        ("a2_core_frames_quantity", "Quantity", "trunk_quantity_a2", "V_COR-A1B1-01", quantity),
        ("a2_core_frames_chunks", "Chunks & formulae", "trunk_chunks_a2", "V_PHR-A1B1-01", chunks),
        ("a2_core_frames_glue", "Function glue", "trunk_glue_a2", "V_PHR-A1B1-01", glue),
    ]


def merge_pairs(*lists: list[tuple[str, str]]) -> list[tuple[str, str]]:
    seen = set()
    out = []
    for lst in lists:
        for en, cz in lst:
            k = en.lower()
            if k in seen:
                continue
            seen.add(k)
            out.append((en, cz))
    return out


def pad_to_8(pairs: list[tuple[str, str]], filler: list[tuple[str, str]]) -> list[tuple[str, str]]:
    out = list(pairs)
    fi = 0
    while len(out) < 8 and fi < len(filler):
        en, cz = filler[fi]
        fi += 1
        if en.lower() not in {x[0].lower() for x in out}:
            out.append((en, cz))
    return out


def main() -> None:
    print("Generating A2 Oxford fill packs…")
    nodes: list[dict] = []

    leaf_specs = [
        ("a2_home", "Home life", "leaf_home_a2", CODEX["home"], HOME, "V_THM-A1B1-01 home / housing A2"),
        ("a2_work", "Work", "leaf_work_a2", CODEX["work"], WORK, "V_THM-A1B1-02 work A2"),
        ("a2_family", "Family & people", "leaf_family_a2", CODEX["family"], FAMILY, "V_THM-A1B1-04 family A2"),
        ("a2_food", "Food & drink", "leaf_food_a2", CODEX["food"], FOOD, "V_THM-A1B1-05 food A2"),
        ("a2_shopping", "Shopping & money", "leaf_shopping_a2", CODEX["shopping"], SHOPPING, "V_THM-A1B1-06 shopping A2"),
        ("a2_routine", "Routine & habits", "leaf_routine_a2", CODEX["routine"], ROUTINE, "V_THM-A1B1-08 routine A2"),
        ("a2_freetime", "Free time", "leaf_freetime_a2", CODEX["freetime"], FREETIME, "V_THM-A1B1-09 free time A2"),
        ("a2_sports", "Sport", "leaf_sports_a2", CODEX["sports"], SPORTS, "V_THM-A1B1-09 sport slice"),
        ("a2_nature", "Nature & weather", "leaf_nature_a2", CODEX["nature"], NATURE, "Nature/weather A2"),
        ("a2_tech", "Tech & media", "leaf_tech_a2", CODEX["tech"], TECH, "Tech A2 · COR"),
        ("a2_school", "School & learning", "leaf_school_a2", CODEX["school"], SCHOOL, "Study A2 · THM work/study"),
        ("a2_clothes", "Clothes", "leaf_clothes_a2", CODEX["clothes"], CLOTHES, "Clothes A2"),
        ("a2_feelings", "Feelings", "leaf_feelings_a2", CODEX["feelings"], FEELINGS, "Feelings A2"),
        ("a2_ideas", "Ideas & abstract", "leaf_ideas_a2", CODEX["ideas"], IDEAS, "Abstract A2 · COR"),
        ("a2_society", "Society", "leaf_society_a2", CODEX["society"], SOCIETY, "Public life seed A2 · COR"),
        ("a2_media", "Media & arts", "leaf_media_a2", CODEX["media"], MEDIA, "Media A2"),
        ("a2_describing", "Describing words", "leaf_describing_a2", CODEX["describing"], DESCRIBING, "A2 adjectives · COR"),
        ("a2_adverbs", "Adverbs", "leaf_adverbs_a2", CODEX["adverbs"], ADVERBS, "A2 adverbs · COR"),
        ("a2_verbs", "Verbs · A2 list", "leaf_verbs_a2", CODEX["verbs"], VERBS, "A2 verbs bare lemmas · COR (frames elsewhere)"),
        ("a2_misc", "General core", "leaf_misc_a2", CODEX["misc"], MISC, "Overflow A2 · COR"),
    ]

    # extend existing travel/health packs by rewriting with extras merged
    travel_base = []
    health_base = []
    # load existing if present
    for path, acc in [
        (BLOCKS / "a2_travel.json", travel_base),
        (BLOCKS / "a2_health.json", health_base),
    ]:
        if path.exists():
            pack = json.loads(path.read_text(encoding="utf-8"))
            for b in pack["blocks"]:
                for it in b["items"]:
                    acc.append((it["en"], it["cz"]))

    travel_all = merge_pairs(travel_base, TRAVEL_EXTRA)
    health_all = merge_pairs(health_base, HEALTH)

    leaf_specs_existing = [
        ("a2_travel", "Travel & holidays", "leaf_travel_a2", CODEX["travel"], travel_all, "V_THM-A1B1-03 travel A2 full"),
        ("a2_health", "Health", "leaf_health_a2", CODEX["health"], health_all, "V_THM-A1B1-07 health A2 full"),
    ]

    for spec in leaf_specs_existing + leaf_specs:
        pack_id, title, node, codex, pairs, note = spec
        if len(pairs) < 8:
            pairs = pad_to_8(pairs, MISC)
        node_obj = write_leaf(pack_id, title, node, codex, pairs, note)
        if node_obj:
            nodes.append(node_obj)

    for pack_id, title, node, codex, items in trunk_frames_data():
        node_obj = write_frames(pack_id, title, node, codex, items, f"A2 frames · {codex}")
        if node_obj:
            nodes.append(node_obj)

    # Patch tree.json: remove old A2 live nodes we replace; add all new
    tree = json.loads(TREE.read_text(encoding="utf-8"))
    keep = []
    a2_replace_ids = {n["id"] for n in nodes}
    # also keep past + time_preps if not regenerated
    preserve = {"trunk_past_a2", "trunk_time_preps_a2"}
    for n in tree["nodes"]:
        if n.get("id") in a2_replace_ids:
            continue  # replaced
        if n.get("id") in ("leaf_travel_a2", "leaf_health_a2") and n["id"] in a2_replace_ids:
            continue
        keep.append(n)

    # insert new A2 nodes before craft
    craft_idx = next((i for i, n in enumerate(keep) if n.get("id") == "craft"), len(keep))
    # keep preserved A2 trunks already in keep
    existing_ids = {n["id"] for n in keep}
    to_insert = [n for n in nodes if n["id"] not in existing_ids]
    # also if travel/health were removed, insert is in to_insert
    for n in nodes:
        if n["id"] in existing_ids:
            # replace in place
            for i, old in enumerate(keep):
                if old["id"] == n["id"]:
                    keep[i] = n
                    break
        else:
            keep.insert(craft_idx, n)
            craft_idx += 1
            existing_ids.add(n["id"])

    tree["nodes"] = keep
    tree["app"] = "rue3-grok-exp"
    tree["author_open"] = True
    TREE.write_text(json.dumps(tree, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Updated tree.json · A2-related nodes written: {len(nodes)}")


if __name__ == "__main__":
    main()
