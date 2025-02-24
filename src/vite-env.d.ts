/// <reference types="vite/client" />
declare namespace NodeJS {
    interface ProcessEnv {
        SECRET_KEY?: string;
    }
}