import React from 'react';
import { savePlayerData, loadPlayerData } from '../managers/SaveLoadManager';
import { PlayerData } from '../types/GameTypes';

const SaveLoad: React.FC<{ playerData: PlayerData }> = ({ playerData }) => {
    return (
        <div className="flex flex-col gap-2 h-full">
            <button onClick={() => savePlayerData(playerData)} className="bg-teal-600 hover:bg-teal-700 text-white rounded">
                Save
            </button>
            <input
                type="file"
                accept=".txt"
                onChange={async (e) => {
                    if (e.target.files) {
                        const data = await loadPlayerData(e.target.files[0]);
                        console.log('Loaded:', data);
                    }
                }}
                className="bg-gray-600 w-full text-white  rounded text-center file:bg-teal-600 file:text-white file:border-0 file:rounded file:px-2 file:py-1"
            />
        </div>
    );
};

export default SaveLoad;