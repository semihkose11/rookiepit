/* sonraki.js — modul sonu eylem kutusu.
   Test bitince sorular bolumunun altinda ortalanmis iki secenek gosterir:
   "Sonraki module gec" ve "Modulu tekrarla". Sonraki modul, modul listesindeki
   olcut karsilanmadan tiklanamaz: olcut (tuval + test) / 2 >= 70, tuvali olmayan
   modullerde yalnizca test puanidir.
   Sayfa render() sonunda FRC_SONRAKI.kur({id, bitti, test, tuval, tekrar}) cagirir. */
(function () {
  "use strict";

  var GECER = 70;

  var MOD = [
    {"i": "electrical-00-tools", "d": "electrical", "n": "00", "t": "Aletler: Elektrik Ekibinin Takım Çantası", "f": "electrical-00-tools.html", "v": 0},
    {"i": "electrical-01-power-path", "d": "electrical", "n": "01", "t": "Power Path: Battery'den PD'ye", "f": "electrical-01-power-path.html", "v": 1},
    {"i": "electrical-02-circuit-protection", "d": "electrical", "n": "02", "t": "Circuit Protection: Branch Breaker ve Fuse Seçimi", "f": "electrical-02-circuit-protection.html", "v": 1},
    {"i": "electrical-03-can-bus", "d": "electrical", "n": "03", "t": "CAN Bus: Zincir, Termination ve Device ID", "f": "electrical-03-can-bus.html", "v": 1},
    {"i": "electrical-04-radio", "d": "electrical", "n": "04", "t": "Radio: Besleme, Bağlantı ve Status Lights", "f": "electrical-04-radio.html", "v": 1},
    {"i": "electrical-05-brownout", "d": "electrical", "n": "05", "t": "Brownout: Voltage Sag ve Current Draw", "f": "electrical-05-brownout.html", "v": 1},
    {"i": "electrical-06-status-lights", "d": "electrical", "n": "06", "t": "Status Lights: roboRIO, RSL ve PD", "f": "electrical-06-status-lights.html", "v": 1},
    {"i": "electrical-07-pneumatics", "d": "electrical", "n": "07", "t": "Pneumatics: Basınç Bölgeleri, Koruma ve Besleme", "f": "electrical-07-pneumatics.html", "v": 1},
    {"i": "electrical-08-motors", "d": "electrical", "n": "08", "t": "Motorlar ve Motor Controller'lar", "f": "electrical-08-motors.html", "v": 1},
    {"i": "electrical-09-custom-circuits", "d": "electrical", "n": "09", "t": "Custom Circuit'ler ve Legal Wiring", "f": "electrical-09-custom-circuits.html", "v": 1},
    {"i": "electrical-10-wire-management", "d": "electrical", "n": "10", "t": "Wire Management, Strain Relief ve Bakım", "f": "electrical-10-wire-management.html", "v": 1},
    {"i": "electrical-11-control-system", "d": "electrical", "n": "11", "t": "Kontrol Sistemi Bütünlüğü: roboRIO, MXP ve Co-Processor", "f": "electrical-11-control-system.html", "v": 1},
    {"i": "electrical-12-inspection", "d": "electrical", "n": "12", "t": "Inspection Points: Elektrik Denetimi Baştan Sona", "f": "electrical-12-inspection.html", "v": 1},
    {"i": "programming-00-java-vscode", "d": "programming", "n": "00", "t": "Temel Java ve VS Code", "f": "programming-00-java-vscode.html", "v": 1},
    {"i": "programming-00b-wpilib-temelleri", "d": "programming", "n": "00b", "t": "WPILib Temelleri", "f": "programming-00b-wpilib-temelleri.html", "v": 1},
    {"i": "programming-01-project-structure", "d": "programming", "n": "01", "t": "Proje Yapısı ve Robot Yaşam Döngüsü", "f": "programming-01-project-structure.html", "v": 1},
    {"i": "programming-02-deploy", "d": "programming", "n": "02", "t": "Deploy ve Driver Station Bağlantısı", "f": "programming-02-deploy.html", "v": 1},
    {"i": "programming-03-command-based", "d": "programming", "n": "03", "t": "Command-Based Temelleri", "f": "programming-03-command-based.html", "v": 1},
    {"i": "programming-04-subsystems", "d": "programming", "n": "04", "t": "Subsystem'ler ve Default Command'ler", "f": "programming-04-subsystems.html", "v": 1},
    {"i": "programming-05-motor-controllers", "d": "programming", "n": "05", "t": "Motor Controller'ları Koddan Sürmek", "f": "programming-05-motor-controllers.html", "v": 1},
    {"i": "programming-06-triggers", "d": "programming", "n": "06", "t": "Joystick ve Tuş Bağlamaları", "f": "programming-06-triggers.html", "v": 1},
    {"i": "programming-07-sensors", "d": "programming", "n": "07", "t": "Sensor'ler: Encoder, Limit Switch ve Gyro", "f": "programming-07-sensors.html", "v": 1},
    {"i": "programming-08-pid", "d": "programming", "n": "08", "t": "Closed-Loop Kontrol ve PIDController", "f": "programming-08-pid.html", "v": 1},
    {"i": "programming-09-telemetry", "d": "programming", "n": "09", "t": "Telemetry ve Driver Station Loglarıyla Hata Ayıklama", "f": "programming-09-telemetry.html", "v": 1},
    {"i": "programming-10-autonomous", "d": "programming", "n": "10", "t": "Autonomous Rutinleri ve SendableChooser", "f": "programming-10-autonomous.html", "v": 1},
    {"i": "programming-11-simulation", "d": "programming", "n": "11", "t": "Simulation ve Unit Test", "f": "programming-11-simulation.html", "v": 1},
    {"i": "programming-12-competition", "d": "programming", "n": "12", "t": "Yarışmaya Hazırlık ve Yazılım Denetimi", "f": "programming-12-competition.html", "v": 1},
    {"i": "cad-01-onshape-basics", "d": "cad", "n": "01", "t": "Onshape'e Giriş: Document, Part Studio ve Assembly", "f": "cad-01-onshape-basics.html", "v": 1},
    {"i": "cad-02-sketching", "d": "cad", "n": "02", "t": "Sketch Temelleri ve Kısıtlanma Durumu", "f": "cad-02-sketching.html", "v": 1},
    {"i": "cad-03-constraints", "d": "cad", "n": "03", "t": "Sketch Constraint'leri ve Tasarım Niyeti", "f": "cad-03-constraints.html", "v": 1},
    {"i": "cad-04-features", "d": "cad", "n": "04", "t": "Feature'lar ve Extrude'un End Condition'ları", "f": "cad-04-features.html", "v": 1},
    {"i": "cad-05-variables-configurations", "d": "cad", "n": "05", "t": "Variable'lar ve Configuration'lar", "f": "cad-05-variables-configurations.html", "v": 1},
    {"i": "cad-06-in-context", "d": "cad", "n": "06", "t": "Multi-Part Part Studio ve In-Context Tasarım", "f": "cad-06-in-context.html", "v": 1},
    {"i": "cad-07-mates", "d": "cad", "n": "07", "t": "Assembly Mate'leri ve Mate Connector", "f": "cad-07-mates.html", "v": 1},
    {"i": "cad-08-versions-branches", "d": "cad", "n": "08", "t": "Version, Branch ve Merge", "f": "cad-08-versions-branches.html", "v": 1},
    {"i": "cad-09-drawings", "d": "cad", "n": "09", "t": "Drawing: Teknik Resim ve Güncelleme", "f": "cad-09-drawings.html", "v": 1},
    {"i": "cad-10-cots-imports", "d": "cad", "n": "10", "t": "COTS Parçalar, Import ve Linked Document", "f": "cad-10-cots-imports.html", "v": 1},
    {"i": "cad-11-robot-rules", "d": "cad", "n": "11", "t": "Robot Kuralları ve CAD", "f": "cad-11-robot-rules.html", "v": 1},
    {"i": "cad-12-design-review", "d": "cad", "n": "12", "t": "Capstone: CAD Tasarım İncelemesi", "f": "cad-12-design-review.html", "v": 1}
  ];

  var STIL = ''
    + '#sonraki{margin:22px 0 0;padding:22px 18px;border:1px solid var(--hair);'
    + 'border-radius:14px;background:var(--surface);text-align:center}'
    + '#sonraki .sncap{font:500 12px/1 var(--mono);letter-spacing:.1em;'
    + 'text-transform:uppercase;color:var(--mute);margin:0 0 6px}'
    + '#sonraki .snttl{font:500 15px/1.45 var(--sans);color:var(--body);'
    + 'margin:0 auto 16px;max-width:46ch}'
    + '#sonraki .snsira{font-weight:700;color:var(--ink)}'
    + '#sonraki .snsr{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}'
    + '#sonraki .snd{font:600 14px/1 var(--sans);border-radius:10px;padding:14px 22px;'
    + 'cursor:pointer;border:1px solid var(--hair);background:var(--sunk);color:var(--body);'
    + 'text-decoration:none;display:inline-block}'
    + '#sonraki .snd:hover{border-color:var(--acc);color:var(--acc)}'
    + '#sonraki .snd.ana{background:var(--acc);color:var(--ground);border-color:var(--acc)}'
    + '#sonraki .snd.ana:hover{filter:brightness(1.08);color:var(--ground)}'
    + '#sonraki .snd:focus-visible{outline:2.5px solid var(--ink);outline-offset:3px}'
    + '#sonraki .snd.kilit{opacity:.55;cursor:not-allowed}'
    + '#sonraki .snd.kilit:hover{border-color:var(--hair);color:var(--ground);filter:none}'
    + '#sonraki .snnot{margin:14px auto 0;max-width:46ch;'
    + 'font:400 13px/1.55 var(--sans);color:var(--mute)}'
    + '@media print{#sonraki{display:none}}';

  function stil() {
    if (document.getElementById("sonrakiStil")) return;
    var s = document.createElement("style");
    s.id = "sonrakiStil";
    s.textContent = STIL;
    document.head.appendChild(s);
  }

  function el(t, c, x) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (x != null) n.textContent = x;
    return n;
  }

  function sirasi(id) {
    for (var i = 0; i < MOD.length; i++) if (MOD[i].i === id) return i;
    return -1;
  }

  function sonrakiModul(ix) {
    var s = MOD[ix + 1];
    return (s && s.d === MOD[ix].d) ? s : null;
  }

  function kaldir() {
    var k = document.getElementById("sonraki");
    if (k) k.parentNode.removeChild(k);
  }

  function yerlestir(kutu) {
    var q = document.getElementById("qs");
    if (!q) return;
    var yuva = q.parentNode;
    while (yuva && yuva.tagName !== "SECTION") yuva = yuva.parentNode;
    if (!yuva) { q.parentNode.appendChild(kutu); return; }
    yuva.parentNode.insertBefore(kutu, yuva.nextSibling);
  }

  function kur(o) {
    o = o || {};
    kaldir();
    if (!o.bitti) return;

    var ix = sirasi(o.id);
    if (ix < 0) return;
    var bu = MOD[ix], snk = sonrakiModul(ix);

    var test = (typeof o.test === "number") ? o.test : null;
    var tuval = (typeof o.tuval === "number") ? o.tuval : null;
    var ort = bu.v ? ((test !== null && tuval !== null) ? Math.round((test + tuval) / 2) : null)
                   : test;
    var acik = ort !== null && ort >= GECER;

    stil();

    var kutu = el("div");
    kutu.id = "sonraki";
    kutu.append(el("p", "sncap", "modül sonu"));

    var ttl = el("p", "snttl");
    if (snk) {
      ttl.append(document.createTextNode("Sıradaki modül: "));
      ttl.append(el("span", "snsira", snk.n + " · " + snk.t));
    } else {
      ttl.textContent = "Bu bölümün son modülüdür.";
    }
    kutu.append(ttl);

    var sr = el("div", "snsr");

    var ileri = el("a", "snd ana", snk ? "Sonraki modüle geç" : "Modül listesine dön");
    if (!snk) {
      ileri.href = "moduller.html";
    } else if (acik) {
      ileri.href = snk.f;
    } else {
      ileri.className = "snd ana kilit";
      ileri.setAttribute("role", "link");
      ileri.setAttribute("aria-disabled", "true");
      ileri.tabIndex = 0;
      ileri.onclick = function (e) { e.preventDefault(); };
    }
    sr.append(ileri);

    var tkr = el("button", "snd", "Modülü tekrarla");
    tkr.type = "button";
    tkr.onclick = function () { if (typeof o.tekrar === "function") o.tekrar(); };
    sr.append(tkr);

    kutu.append(sr);

    if (snk && !acik) {
      var not;
      if (bu.v && tuval === null) {
        not = "Sonraki modül, tuval ile test puanının ortalaması %70'e ulaşınca açılır. "
            + "Tuval bölümünü henüz tamamlamadınız.";
      } else {
        not = "Sonraki modül, " + (bu.v ? "tuval ile test puanının ortalaması" : "test puanınız")
            + " %70'e ulaşınca açılır. Şu anki değer: %" + ort + ".";
      }
      kutu.append(el("p", "snnot", not));
    }

    yerlestir(kutu);
  }

  window.FRC_SONRAKI = { kur: kur, kaldir: kaldir, GECER: GECER };
})();
