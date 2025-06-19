import React from 'react';
import { PlayerData } from '../types/GameTypes';
import { playerDataManager } from '../managers/PlayerDataManager';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"

const StatsBar: React.FC<{ playerData: PlayerData }> = ({ playerData }) => {

    return (
        <div className="bg-gray-800 text-gray-200 p-2 rounded-lg shadow-lg h-full w-full overflow-hidden">
            <Carousel >
                <CarouselContent >
                    <CarouselItem key={1} >
                        <div className='flex flex-col  p-1 h-full mt-2'>
                            <div className="rounded-lg flex flex-col *:even:bg-gray-600/50 h-38 overflow-y-auto overflow-x-hidden px-6 *:text-base *:h-6 *:text-gray-200" >
                                <div>Atk: {playerDataManager.calcAttack(playerData)}</div>
                                <div>Mag:  {playerDataManager.calcMagic(playerData)}</div>
                                <div>Def: {playerDataManager.calcDefense(playerData)}</div>
                                <div>Spd: {playerDataManager.calcSpeed(playerData)}</div>
                                <div>Crit%: {playerDataManager.calcCrit(playerData)}</div>
                                <div>CritDmg%: {playerDataManager.calcCritDamage(playerData)}</div>
                            </div>
                        </div>
                    </CarouselItem>
                    <CarouselItem key={2}>
                        <div className='flex flex-col p-1'>
                            <h4 className="ml-4 mt-1 font-bold">Stats point [ {playerData.statsPoints} ]</h4>
                            <div className='overflow-y-auto overflow-x-hidden pl-6 flex flex-col *:even:bg-gray-600/50 gap-1 *:text-gray-200 '>
                                <div className='flex justify-between items-center'>
                                    <div className='text-base'> Str: {playerData.distributedBonusStatsPoints.Str}</div>
                                    <Button size="icon" onClick={() => playerDataManager.distributeBonusStatsPoints("Str")} className="bg-emerald-500 hover:bg-emerald-200 text-center font-extrabold text-ll rounded-md w-7 h-7"><svg className='text-emerald-900' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" ><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg></Button>
                                </div>
                                <div className='flex justify-between items-center'>
                                    <div className='text-base'> Int: {playerData.distributedBonusStatsPoints.Int}</div>
                                    <Button size="icon" onClick={() => playerDataManager.distributeBonusStatsPoints("Int")} className="bg-emerald-500 hover:bg-emerald-200 text-center font-extrabold text-ll rounded-md w-7 h-7"><svg className='text-emerald-900' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" ><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg></Button>
                                </div>
                                <div className='flex justify-between items-center'>
                                    <div className='text-base'> Agi {playerData.distributedBonusStatsPoints.Agi}</div>
                                    <Button size="icon" onClick={() => playerDataManager.distributeBonusStatsPoints("Agi")} className="bg-emerald-500 hover:bg-emerald-200 text-center font-extrabold text-ll rounded-md w-7 h-7"><svg className='text-emerald-900' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" ><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg></Button>
                                </div>
                                <div className='flex justify-between items-center'>
                                    <div className='text-base'> Luc: {playerData.distributedBonusStatsPoints.Luc}</div>
                                    <Button size="icon" onClick={() => playerDataManager.distributeBonusStatsPoints("Luc")} className="bg-emerald-500 hover:bg-emerald-200 text-center font-extrabold text-ll rounded-md w-7 h-7"><svg className='text-emerald-900' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" ><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M12 5l0 14" /><path d="M5 12l14 0" /></svg></Button>
                                </div>
                            </div>
                        </div>
                    </CarouselItem>
                </CarouselContent>
                <div className="absolute z-20 *:h-6 right-8">
                    <CarouselPrevious className="bg-gray-800 text-gray-200 rounded-r-lg border-r-0 -mx-8" />
                    <CarouselNext className="bg-gray-800 text-gray-200 rounded-l-lg" />
                </div>
            </Carousel>
        </div>
    );
};

export default StatsBar;