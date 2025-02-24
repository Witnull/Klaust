import React from 'react';
import { PlayerData } from '../types/PlayerData';
import { playerDataManager } from '../managers/PlayerDataManager';

const StatsBar: React.FC<{ playerData: PlayerData }> = ({ playerData }) => {
 
  return (
    <div className="bg-gray-800 text-gray-200 grid grid-cols-2 p-2 rounded-lg shadow-lg h-full w-full gap-2 overflow-hidden">
      
      <div className='flex flex-col bg-gray-700/50 rounded-lg p-1'>
        <h4 className="text-lg font-bold">Stats</h4>
        <div className="rounded-lg flex flex-col *:even:bg-gray-600/50 h-38 overflow-y-auto overflow-x-hidden px-6 *:text-base *:h-6 *:text-gray-200" >
            <p>Max Health: {playerDataManager.calcMaxHP(playerData)}</p>
            <p>Max Mana: {playerDataManager.calcMaxMana(playerData)}</p>
            <p>Attack: {playerDataManager.calcAttack(playerData)}</p>
            <p>Magic:  {playerDataManager.calcMagic(playerData)}</p>
            <p>Defense: {playerDataManager.calcDefense(playerData)}</p>
            <p>Speed: {playerDataManager.calcSpeed(playerData)}</p>
        </div>
      </div>

      <div className='flex flex-col bg-gray-700/50 rounded-lg p-1'>
      <h4 className="text-lg font-bold">Stats point [ {playerData.statsPoints} ]</h4>
        <div className='overflow-y-auto overflow-x-hidden pl-6 flex flex-col *:even:bg-gray-600/50 gap-1 *:text-gray-200 '>
           <div className='flex justify-between items-center'>
                <p className='text-base'> Strength: {playerData.distributedBonusStatsPoints.Str}</p>
                <button onClick={() => playerDataManager.distributeBonusStatsPoints("Str")} className="bg-emerald-500 text-center font-extrabold text-ll rounded-md w-7 h-7">+</button>
           </div>
           <div className='flex justify-between items-center'>
                <p className='text-base'> Inteligent: {playerData.distributedBonusStatsPoints.Int}</p>
                <button  onClick={() => playerDataManager.distributeBonusStatsPoints("Int")} className="bg-emerald-500 text-center font-extrabold text-ll rounded-md w-7 h-7">+</button>
           </div>
           <div className='flex justify-between items-center'>
                <p className='text-base'> Agility: {playerData.distributedBonusStatsPoints.Agi}</p>
                <button  onClick={() => playerDataManager.distributeBonusStatsPoints("Agi")} className="bg-emerald-500 text-center font-extrabold text-ll rounded-md w-7 h-7">+</button>
           </div>
           <div className='flex justify-between items-center'>
                <p className='text-base'> Luck: {playerData.distributedBonusStatsPoints.Luc}</p>
                <button  onClick={() => playerDataManager.distributeBonusStatsPoints("Luc")} className="bg-emerald-500 text-center font-extrabold text-ll rounded-md w-7 h-7">+</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StatsBar;