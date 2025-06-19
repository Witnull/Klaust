import React, { useState, useEffect, useRef } from "react";
import { combatEvent } from "../EventBus";
import { EnemyData, PlayerData, Stats } from "../types/GameTypes";
import { playerDataManager } from "../managers/PlayerDataManager";

interface DamagePopup {
  id: string;
  target: string;
  damage: number;
  x: number;
  y: number;
  opacity: number;
  duration: number; // Time remaining for animation
}



const CombatOverlay: React.FC = () => {
  const [inCombat, setInCombat] = useState(false);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [enemy, setEnemy] = useState<EnemyData | null>(null);
  const [isEnemyShaking, setIsEnemyShaking] = useState(false); // Track shake effect for enemy
  const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
  const combatLogRef = useRef<HTMLDivElement>(null);
  const popupIdCounter = useRef(0); // Counter for unique keys

  useEffect(() => {
    // Event Handlers
    const handleEnterCombat = ({ player, enemy }: { player: PlayerData, enemy: EnemyData }) => {
      setPlayer(player);
      setEnemy(enemy);
      setInCombat(true);
      setIsEnemyShaking(false);
      setDamagePopups([]);
      if (combatLogRef.current) combatLogRef.current.innerHTML = ''; // Clear log on new combat
    };

    const handleCombatUpdate = ({ player, enemy }: { player: PlayerData, enemy: EnemyData }) => {
      setPlayer({ ...player });
      setEnemy({ ...enemy });
      setIsEnemyShaking(false);
    };

    const handleCombatEnd = () => {
      setInCombat(false);
      setPlayer(null);
      setEnemy(null);
      setIsEnemyShaking(false);
      setDamagePopups([]);
      if (combatLogRef.current) combatLogRef.current.innerHTML = ''; // Clear log on combat end
    };

    const handleAttack = () => {
      setIsEnemyShaking(true);
      setTimeout(() => setIsEnemyShaking(false), 500);
    };

    const handleShowDamage = (data: { target: string, attacker: string, damage: number }) => {
      console.log(`CombatOverlay: showDamage received with attacker:${data}`);
      const enemyImage = document.querySelector('.enemy-image');
      const enemyRect = enemyImage?.getBoundingClientRect();
      const enemyClass = 'text-red-200 text-sm py-1';
      const playerClass = 'text-emerald-200 text-sm py-1';

      if (enemyRect) {
        // Calculate position relative to the enemy image's top-left corner
        let relativeX = Math.random() * enemyRect.width * 5;
        let relativeY = enemyRect.height;

        if (data.target == player?.name) {
          relativeX = Math.random() * enemyRect.width * 4;
          relativeY = enemyRect.height + 200;
        }

        const uniqueId = `${Date.now()}-${popupIdCounter.current++}`;
        setDamagePopups((prev) => [
          ...prev,
          { id: uniqueId, target: data.target, damage: data.damage, x: relativeX, y: relativeY, opacity: 1, duration: 3500 },
        ]);

        if (combatLogRef.current) {

          const logEntry = document.createElement('p');
          logEntry.textContent = `${data.attacker}: dealt ${data.damage} damage to ${data.target}`;
          logEntry.className = data.attacker === player?.name ? playerClass : enemyClass;
          combatLogRef.current.appendChild(logEntry);
          combatLogRef.current.scrollTop = combatLogRef.current.scrollHeight;
        }
      }
    };

    // Event Listeners
    combatEvent.on('enterCombat', handleEnterCombat);
    combatEvent.on('combatUpdate', handleCombatUpdate);
    combatEvent.on('combatEnd', handleCombatEnd);
    combatEvent.on('normalAttack', handleAttack);
    combatEvent.on('fireball', handleAttack);
    combatEvent.on('showDamage', handleShowDamage);

    return () => {
      combatEvent.off('enterCombat', handleEnterCombat);
      combatEvent.off('combatUpdate', handleCombatUpdate);
      combatEvent.off('combatEnd', handleCombatEnd);
      combatEvent.off('normalAttack', handleAttack);
      combatEvent.off('fireball', handleAttack);
      combatEvent.off('showDamage', handleShowDamage);
    };
  }, [player?.name, enemy?.name]); // Dependencies for log text

  useEffect(() => {
    let animationFrameId: number;
    const animatePopups = () => {
      setDamagePopups((prev) =>
        prev
          .map((popup) => ({
            ...popup,
            y: popup.y - 1, // Move up relative to initial position
            opacity: Math.max(0, popup.opacity - 0.02),
            duration: popup.duration - 16,
          }))
          .filter((popup) => popup.duration > 0 && popup.opacity > 0)
      );
      animationFrameId = requestAnimationFrame(animatePopups);
    };
    animationFrameId = requestAnimationFrame(animatePopups);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Action Handlers
  const handleNormalAttack = () => combatEvent.emit('normalAttack');
  const handleFireball = () => combatEvent.emit('fireball');
  const handleFlee = () => combatEvent.emit('flee');

  if (!inCombat || !player || !enemy) return null;
  const p_hpPercent = (player.stats.hp / player.stats.max_hp) * 100;
  const p_manaPercent = (player.stats.mana / player.stats.max_mana) * 100;

  const e_hpPercent = (enemy.stats.hp / enemy.stats.max_hp) * 100;
  const e_manaPercent = (enemy.stats.mana / enemy.stats.max_mana) * 100;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75">
      <div className="flex w-4/6 gap-6 h-[90vh] max-h-[800px]">
        {/* Main Stats Box */}
        <div className="flex flex-col w-2/3 overflow-y-auto bg-gray-800 rounded-xl p-6 text-gray-200 cursor-default select-none">
          <div>
            <h3 className="text-2xl font-bold text-center tracking-tight">
              {enemy.name} - Lv.{enemy.level}
            </h3>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-medium">
              Health: {enemy.stats.hp} / {enemy.stats.max_hp}
            </p>
            <div className="w-[70%] h-2 bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-400 to-green-500 rounded-full transition-all duration-300"
                style={{ width: `${e_hpPercent}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-medium">
              Mana: {enemy.stats.mana} / {enemy.stats.max_mana}
            </p>
            <div className="w-[70%] h-2 bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                style={{ width: `${e_manaPercent}%` }}
              />
            </div>
          </div>
          <div className="flex gap-6 mb-2 text-sm font-medium">
            <p>Attack: {enemy.stats.attack}</p>
            <p>Magic: {enemy.stats.magic}</p>
            <p>Defense: {enemy.stats.defense}</p>
            <p>Speed: {enemy.stats.speed}</p>
          </div>
          {/* Enemy Image */}
          <div className="relative w-full h-64 bg-gray-700/40 flex items-center justify-center rounded-lg transition-transform duration-500">
            <img
              src="/assets/sprites/enemy.png"
              alt="Enemy"
              className={`min-w-30 min-h-30 max-w-full max-h-full object-contain enemy-image ${isEnemyShaking ? 'animate-shake' : ''}`}
            />
            {damagePopups.map((popup) => (
              <div
                key={popup.id}
                className={`absolute ${popup.target == enemy.name ? "text-red-600" : "text-yellow-700"} text-5xl font-bold pointer-events-none`}
                style={{
                  left: `${popup.x}px`,
                  top: `${popup.y}px`,
                  opacity: popup.opacity,
                  transform: 'translate(50%, -50%)',
                }}
              >
                -{popup.damage}
              </div>
            ))}
          </div>

          <div className="flex gap-6 mt-2 text-sm font-medium">
            <p>Attack: {playerDataManager.calcAttack(player)}</p>
            <p>Magic: {playerDataManager.calcMagic(player)}</p>
            <p>Defense: {playerDataManager.calcDefense(player)}</p>
            <p>Speed: {playerDataManager.calcSpeed(player)}</p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-medium">
              Health: {player.stats.hp} / {playerDataManager.calcMaxHP(player)}
            </p>
            <div className="w-[70%] h-2 bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-400 to-green-500 rounded-full transition-all duration-300"
                style={{ width: `${p_hpPercent}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 mb-1">
            <p className="text-base font-medium">
              Mana: {player.stats.mana} / {playerDataManager.calcmax_mana(player)}
            </p>
            <div className="w-[70%] h-2 bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                style={{ width: `${p_manaPercent}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-[1fr_2fr_1fr] gap-3">
            <div className="flex items-center justify-center">
              <button
                onClick={handleNormalAttack}
                className="relative w-full h-16 bg-gradient-to-r from-gray-700 to-gray-600 hover:to-amber-600 text-white py-2 px-4 rounded-lg shadow-lg transition-colors duration-200 overflow-hidden"
              >
                <div className="absolute inset-0 flex items-center justify-end p-2">
                  <svg className="w15 h-15" fill="#1C274C" viewBox="0 0 256 256" id="Flat" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M224.48535,31.51465A11.9987,11.9987,0,0,0,216,28h-.03809l-63.79882.20117a11.99773,11.99773,0,0,0-8.84082,3.92774l-71.53418,78.6875-1.64649-1.64649a20.02681,20.02681,0,0,0-28.28418.002L25.17285,125.85645a19.9986,19.9986,0,0,0-.001,28.28515l14.05859,14.05957L20.11719,187.31348a20.02339,20.02339,0,0,0,0,28.28466l20.28515,20.2837a19.9992,19.9992,0,0,0,28.28418.00048l19.11231-19.11279,14.05957,14.06055a20.02636,20.02636,0,0,0,28.28418-.002l16.68457-16.68457a19.9986,19.9986,0,0,0,.001-28.28515l-1.645-1.64551,78.688-71.53418a12.00066,12.00066,0,0,0,3.92774-8.8418L228,40.03809A12.00167,12.00167,0,0,0,224.48535,31.51465ZM116,211.02979,101.94141,196.9707a19.9986,19.9986,0,0,0-28.28418,0L54.544,216.083,39.916,201.45605,59.0293,182.34277a20.02222,20.02222,0,0,0,0-28.28369L44.9707,140,56,128.97021l35.51221,35.5127.00244.00244.00244.00244L127.0293,200Zm87.81543-112.5542-75.62207,68.74707L116.9707,156l51.51465-51.51465a12.0001,12.0001,0,0,0-16.9707-16.9707L100,139.0293,88.77734,127.80615l68.74707-75.62158,46.4375-.14648Z"></path> </g></svg>                  </div>
                <p className="relative z-10 text-left font-semibold text-lg text-gray-200">
                  Attack
                  <span className="block text-xs">+{playerDataManager.calcManaGain(player)} mana</span>
                </p>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleFireball}
                className="relative w-full h-16 bg-gradient-to-r from-indigo-800 to-gray-600 hover:to-amber-600 text-white py-2 px-4 rounded-lg shadow-lg transition-colors duration-200 overflow-hidden"
              >
                <div className="absolute inset-0 flex items-center justify-end p-2">
                  <svg className="w15 h-15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M3 13.1111C3 20.2222 8.28889 22 10.9333 22C12.2874 22 14.2481 21.6432 16 20.6097M18.7207 18C19.5021 16.7537 20 15.152 20 13.1111C20 8.58427 17.1653 5.35127 14.6023 3.49767C13.4438 2.65985 12 3.58 12 5.00971V5.33334C12 6.7752 11.3938 9.40705 9.70932 10.5017C8.84932 11.0606 7.92052 10.2241 7.816 9.20382L7.73017 8.36598C7.6304 7.39197 6.63841 6.80069 5.85996 7.39454C5.18794 7.90718 4.50139 8.60486 3.96944 9.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"></path> <path d="M8 18.4445C8 21.2889 10.4889 22 11.7333 22C12.8222 22 15 21.2889 15 18.4445C15 17.3435 14.4107 16.6002 13.8404 16.1713C13.4424 15.872 12.8828 16.1408 12.7459 16.6196C12.5675 17.2437 11.9228 17.636 11.5944 17.0759C11.2941 16.5638 11.2941 15.7957 11.2941 15.3334C11.2941 14.6968 10.6539 14.2847 10.1389 14.6589C9.10649 15.4091 8 16.6815 8 18.4445Z" stroke="#1C274C" stroke-width="1.5"></path> </g></svg>
                </div>
                <p className="relative z-10 text-left font-semibold text-lg text-gray-200">
                  Fireball
                  <span className="block text-xs">10 mana</span>
                </p>
              </button>

              <button
                onClick={handleFireball}
                className="w-full h-16 bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-lg shadow-lg transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
                disabled={player.stats.mana < 10}
              >
                Fireball (10 Mana)
              </button>
              {/* Keep additional Fireball buttons if needed */}
            </div>
            <div className="flex items-center justify-center">
              <button
                onClick={handleFlee}
                className="relative w-full h-16 bg-gradient-to-r from-gray-700 to-gray-600 hover:to-amber-600 text-white py-2 px-4 rounded-lg shadow-lg transition-colors duration-200 overflow-hidden"
              >
                <div className="absolute inset-0 flex items-center justify-end p-2">
                  <svg className="w15 h-15" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>run_line</title> <g id="页面-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"> <g id="Transport" transform="translate(-816.000000, 0.000000)"> <g id="run_line" transform="translate(816.000000, 0.000000)"> <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" id="MingCute" fill-rule="nonzero"> </path> <path d="M13,2 C14.6569,2 16,3.34315 16,5 C16,6.4374176 14.989097,7.6387305 13.6394248,7.93171628 L13.469,7.96356 L14.9049,10.261 L16.6286,9.57152 C17.1414,9.36641 17.7234,9.61583 17.9285,10.1286 C18.11895,10.6047714 17.9175097,11.1406102 17.4771844,11.3789437 L17.3714,11.4285 L15.6477,12.118 C14.8018647,12.4562588 13.842291,12.1788775 13.3046353,11.4607677 L13.2089,11.321 L13.0463,11.0609 L12.4403,13.4851 C12.38606,13.7019 12.298348,13.901548 12.184076,14.0798456 L12.0935,14.2095 L13.7468,15.4376 C14.1430667,15.732 14.4146519,16.161037 14.5132351,16.640361 L14.542,16.8223 L14.895,20 L15,20 C15.5523,20 16,20.4477 16,21 C16,21.51285 15.613973,21.9355092 15.1166239,21.9932725 L15,22 L14.0895,22 C13.5690357,22 13.1258286,21.63665 13.0156081,21.1386974 L12.9962,21.0215 L12.5542,17.0431 L9.40368,14.7028 C9.34671,14.6605 9.29553,14.6132 9.2503,14.5621 C8.69851333,14.1200733 8.40463653,13.4019044 8.52705735,12.6715052 L8.55972,12.5149 L9.35399,9.33783 L7.78454,9.80867 L6.94868,12.3162 C6.77404,12.8402 6.20772,13.1233 5.68377,12.9487 C5.19725429,12.7864786 4.9183499,12.286602 5.0208232,11.7965551 L5.05132,11.6838 L5.88717,9.17621 C6.07583833,8.61019583 6.50617896,8.16078701 7.05678434,7.94576318 L7.20984,7.89302 L10.6474,6.86174 C10.2421,6.3502 10,5.70337 10,5 C10,3.34315 11.3431,2 13,2 Z M8.2,15.4 C8.53137,14.9582 9.15817,14.8686 9.6,15.2 C10.0078154,15.5059077 10.1155314,16.0635172 9.86903487,16.4949808 L9.8,16.6 L8.5838,18.2216 C8.13599375,18.8186938 7.32402148,18.990309 6.67848165,18.6455613 L6.55175,18.5697 L4.62197,17.2832 C4.22939,17.5957 3.65616,17.5704 3.29289,17.2071 C2.93241,16.8466385 2.90468077,16.2793793 3.20970231,15.8871027 L3.29289,15.7929 L3.7871,15.2987 C4.09658182,14.9892455 4.56555124,14.9173942 4.94922239,15.107564 L5.06152,15.1725 L7.26759,16.6432 L8.2,15.4 Z M13,4 C12.4477,4 12,4.44772 12,5 C12,5.55228 12.4477,6 13,6 C13.5523,6 14,5.55228 14,5 C14,4.44772 13.5523,4 13,4 Z" id="形状" fill="#09244B"> </path> </g> </g> </g> </g></svg>
                </div>
                <p className="relative z-10 text-left font-semibold text-lg text-gray-200">
                  Flee
                  <span className="block text-xs">rates 50%</span>
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Combat Log Box */}
        <div className="flex w-2/6 items-center justify-center">
          <div className="w-full max-w-[320px] h-[80%] max-h-[640px] rounded-xl bg-gray-800 p-4">
            <div ref={combatLogRef} id="combatLog" className="w-full h-full bg-gray-700/40 rounded-lg p-2 overflow-y-auto">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default CombatOverlay;
