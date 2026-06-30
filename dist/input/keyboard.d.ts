export type KeyboardHandlers = {
    onRefresh: () => void;
    onQuit: () => void;
};
export declare function setupKeyboard(handlers: KeyboardHandlers): () => void;
