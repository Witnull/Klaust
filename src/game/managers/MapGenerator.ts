import Phaser from "phaser";


export interface Room {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    centerX: number;
    centerY: number;
    type?: "normal" | "spawn" | "loot" | "boss";
    connected_to_rooms_id?: string[];
}

export class MapGenerator {
    private chunkSize: number;
    private seed: number;

    constructor(chunkSize: number, seed: number = Date.now()) {
        this.chunkSize = chunkSize;
        this.seed = seed;
    }

    getSeed(): number { return this.seed; }

    generateChunk(
        chunkX: number,
        chunkY: number,
        isSpawnChunk: boolean = false
    ): { map: number[][]; rooms: Room[]; chests: { x: number; y: number }[] } {
        Phaser.Math.RND.sow([
            this.seed.toString(),
            chunkX.toString(),
            chunkY.toString(),
        ]);
        let map: number[][] = Array.from({ length: this.chunkSize }, () =>
            Array(this.chunkSize).fill(1)
        );
        let rooms: Room[] = [];
        const chests: { x: number; y: number }[] = [];

        // Step 1: Generate rooms
        let maxAttempts = 10;
        const roomCount = Phaser.Math.Between(3, 6);
        for (let i = 0; i < roomCount; i++) {
            let width, height, x, y :number | undefined ;
            let overlap : boolean = false; 
            let attempts :number = 0;

            if ( i === 0 && isSpawnChunk) {
                width = 16;
                height = 16;
                x = 8;
                y = 8;
            }
            else{
                do {
                    if( width == undefined && height == undefined && x == undefined && y == undefined ){
                        width = Phaser.Math.Between(5, 18);
                        height = Phaser.Math.Between(5, 18);
                        x = Phaser.Math.Between(1, this.chunkSize - width - 1);
                        y = Phaser.Math.Between(1, this.chunkSize - height - 1);
                    } else if ( !width == undefined && !height == undefined && !x == undefined && !y == undefined && attempts < maxAttempts - 3){
                        width = Phaser.Math.Between(3, 8);
                        height = Phaser.Math.Between(3, 8);
                        x = Phaser.Math.Between(1, this.chunkSize - width - 1);
                        y = Phaser.Math.Between(1, this.chunkSize - height - 1);
                    } else {
                    // console.log("Last "+ (maxAttempts - attempts) +" attempt, trying with 3x3 room")
                        width = 5
                        height = 5
                        x = Phaser.Math.Between(1, this.chunkSize - width - 1);
                        y = Phaser.Math.Between(1, this.chunkSize - height - 1);
                    }

                    overlap = false; 

                    for (const room of rooms) {
                        if (
                            x < room.x + room.w + 1 &&
                            x + width + 1 > room.x &&
                            y < room.y + room.h + 1 &&
                            y + height + 1 > room.y
                        ) {
                            overlap = true;       
                            break;
                        }
                    }
                    attempts++;
                    if (attempts >= maxAttempts) break;
                } while (overlap);
            }

            if (!overlap) {
                const centerX = x + Math.floor(width / 2);
                const centerY = y + Math.floor(height / 2);
                rooms.push({ 
                    id: `${chunkX}_${chunkY}_${i}`,
                    x, 
                    y, 
                    w: width, 
                    h: height, 
                    centerX, 
                    centerY,
                    type: isSpawnChunk ? "spawn" : "normal",
                    connected_to_rooms_id: []
                });

                
                
                for (let ry = y; ry < y + height; ry++) {
                    for (let rx = x; rx < x + width; rx++) {
                        map[ry][rx] = 0; //clear out rooms
                    }
                }

                // map[y][x] = 3; 
                //map[x][y] = 3; 
               // map[centerX][centerY] = 3; // mark center
            }
        }

        // Step 2: Connect rooms within chunk with L-shaped paths
        for (let i = 1; i < rooms.length; i++) {
            const room_current = rooms[i];
            const room_previous = rooms[i - 1];
     
            const x1 = room_current.centerX;
            const y1 = room_current.centerY;
            const x2 = room_previous.centerX;
            const y2 = room_previous.centerY;

            room_current.connected_to_rooms_id?.push(room_previous.id);
            
            map = this.carveLShapedPath(map, x1, y1, x2, y2); // connect to neaby roon in chunk
        }

        // Step 3: Place chests (2 for spawn chunk, 0-2 otherwise)
        const chestCount = isSpawnChunk ? 2 : Phaser.Math.Between(0, 3);
        for (let i = 0; i < chestCount; i++) {
            let cx, cy;
            do {
                cx = Phaser.Math.Between(1, this.chunkSize - 2);
                cy = Phaser.Math.Between(1, this.chunkSize - 2);
            } while (map[cy][cx] !== 0);
            chests.push({ x: cx, y: cy });
        }

        // Step 4: Add traps and doors (example placement)
        for (let i = 0; i < Phaser.Math.Between(0, 3); i++) {
            let tx, ty;
            do {
                tx = Phaser.Math.Between(1, this.chunkSize - 2);
                ty = Phaser.Math.Between(1, this.chunkSize - 2);
            } while (map[ty][tx] !== 0);
            map[ty][tx] = 2; // Trap
        }
        // for (let i = 0; i < Phaser.Math.Between(0, 2); i++) {
        //     let dx, dy;
        //     do {
        //         dx = Phaser.Math.Between(1, this.chunkSize - 2);
        //         dy = Phaser.Math.Between(1, this.chunkSize - 2);
        //     } while (map[dy][dx] !== 0);
        //     map[dy][dx] = 3; // Door
        // }
        return { map, rooms, chests };
    }

    carveLShapedPath(
        map: number[][],
        x1: number,
        y1: number,
        x2: number,
        y2: number
    ): number[][]{
        x1 = Math.max(0, Math.min(this.chunkSize - 1, x1));
        y1 = Math.max(0, Math.min(this.chunkSize - 1, y1));
        x2 = Math.max(0, Math.min(this.chunkSize - 1, x2));
        y2 = Math.max(0, Math.min(this.chunkSize - 1, y2));


        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++){
            map[y1][x] = 0;
            map[y1+1][x] = 0; // path 2 cell wide          
        }
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++){
            map[y][x2] = 0;
            map[y][x2+1] = 0;
        }
        return map;
    }
}
